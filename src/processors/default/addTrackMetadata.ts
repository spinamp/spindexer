import { Axios, AxiosResponse, AxiosError } from 'axios';

import { IPFSClient } from '../../clients/ipfs';
import { DBClient } from '../../db/db';
import { missingTrackMetadata } from '../../triggers/missing';
import { Clients, Processor } from '../../types/processor';
import { getMetadataURL, Track } from '../../types/track';

const name = 'addTrackMetadata';

const getMetadataForTrack = (track: Track, timeout: number, axios: Axios, ipfs: IPFSClient): any => {
  const metadataURL = getMetadataURL(track);
  if (!metadataURL) {
    throw new Error('Track metadataURL missing');
  }
  let queryURL = metadataURL;
  if (track.metadataIPFSHash) {
    queryURL = ipfs.getHTTPURL(track.metadataIPFSHash);
  }
  console.info(`Querying for metadata: ${queryURL}`)
  return axios.get(queryURL, { timeout });
}

const saveMetadata = async (tracks: Track[], dbClient: DBClient) => {
  const trackUpdates = tracks.map((track): ({ id: string } & Partial<Track>) => ({
    id: track.id,
    metadata: track.metadata ? JSON.stringify(track.metadata) : null,
    mimeType: track.metadata?.mimeType,
    metadataError: track.metadataError,
  }));
  await dbClient.update('tracks', trackUpdates);
}

// This function effectively gets a batch of tracks to process. It then sets up a buffer
// of concurrent requests and flushes track requests through until all tracks metadata has
// been processed or timed out. It then updates all those tracks in the DB.
// todo: should probably be abstracted out/generalized
const processorFunction = async (batch: Track[], clients: Clients) => {
  let activeRequests = 0;
  let count = 0;
  console.info(`Processing batch from ${batch[0].id}`);
  const isDone = new Promise(resolve => {
    const fillQueueUntilDone = () => {
      if (activeRequests === 0 && count === batch.length) {
        resolve(true);
      } else {
        while (activeRequests < parseInt(process.env.MAX_CONCURRENT_ROLLING_REQUESTS!) && count < batch.length) {
          const track = batch[count];
          console.info(`Processing track ${count} with id ${track.id}`);
          getMetadataForTrack(track, parseInt(process.env.METADATA_REQUEST_TIMEOUT!), clients.axios, clients.ipfs).then((response: AxiosResponse) => {
            track.metadata = response.data;
            activeRequests--;
          }).catch((error: AxiosError) => {
            console.log({ error: error.message, headers: error.response?.headers })
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
  await saveMetadata(batch, clients.db);
  console.info('Batch done');
};

export const addTrackMetadata: Processor = {
  name,
  trigger: missingTrackMetadata,
  processorFunction,
  initialCursor: undefined
};
