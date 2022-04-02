import { missingTrackMetadata } from '../triggers/empty';
import { Clients, Processor } from '../types/processor';
import { Track } from '../types/tracks';
import axios, { AxiosResponse } from 'axios';
import { DBClient } from '../db/db';

// todo: do metadata url calls to get all metadata and add to track record
// todo: postfilter/zora only music&catalog filter/extra noizd calls/extra centralized calls for optimized media

const name = 'addTrackMetadata';
const MAX_CONCURRENT_REQUESTS = 40;
const REQUEST_TIMEOUT = 2000;
const BATCH_SIZE = 300;

declare global {
  interface PromiseConstructor {
    delay<T>(ms: number, val: T): Promise<T>;
    raceAll<T, V>(promises: Promise<T>[], timeoutTime: number, timeoutVal: V): Promise<(T | V)[]>;
  }
}

Promise.delay = (ms: number, val: any) => {
  return new Promise(resolve => {
    setTimeout(resolve.bind(null, val), ms);
  });
}

Promise.raceAll = <T, V>(promises: Promise<T>[], timeoutTime: number, timeoutVal: V) => {
  return Promise.all(promises.map((p: Promise<T>) => {
    return Promise.race([p, Promise.delay(timeoutTime, timeoutVal)])
  }));
}

const getMetadataForTrack = (track: Track, timeout: number): any => {
  if (!track.tokenMetadataURI) {
    throw new Error('Track tokenMetadataURI missing');
    //todo: maybe track or error rather?
  }
  return axios.get(track.tokenMetadataURI, { timeout });
}

const saveMetadata = (tracks: Track[], dbClient: DBClient) => {
  const trackUpdates = tracks.map(track => ({
    id: track.id,
    metadata: track.metadata,
    metadataError: track.metadataError,
  }));
  dbClient.update('tracks', trackUpdates);
}

// This function effectively gets a batch of tracks to process. It then sets up a buffer
// of concurrent requests and flushes track requests through until all tracks metadata has
// been processed or timed out. It then updates all those tracks in the DB.
const processorFunction = async (tracks: Track[], clients: Clients) => {
  const batch = tracks.slice(0, BATCH_SIZE);
  let activeRequests = 0;
  let count = 0;
  console.info(`Processing batch from ${batch[0].id}`);
  const isDone = new Promise(resolve => {
    const fillQueueUntilDone = () => {
      if (activeRequests === 0 && count === batch.length) {
        resolve(true);
      } else {
        while (activeRequests < MAX_CONCURRENT_REQUESTS && count < batch.length) {
          console.info(`Processing track ${count}`);
          const track = batch[count];
          getMetadataForTrack(track, REQUEST_TIMEOUT).then((response: AxiosResponse) => {
            track.metadata = response.data;
            activeRequests--;
          }).catch((error: Error) => {
            track.metadataError = error.message;
            activeRequests--;
          });
          count++;
          activeRequests++;
        }
        setTimeout(fillQueueUntilDone, 0);
      }
    }
    fillQueueUntilDone();
  });
  await isDone;
  saveMetadata(batch, clients.db);
  console.info('Batch done');
  console.dir(batch, { depth: null });
  // todo: should have some way to skip/detect/error on buggy urls and ideally continue and ignore them.
  // maybe an error field inserted into the record so it can be skipped?
  // todo: should upsert
};

export const addTrackMetadataProcessor: Processor = {
  name,
  trigger: missingTrackMetadata,
  processorFunction,
};
