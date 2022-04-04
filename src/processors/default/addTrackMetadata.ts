import { missingTrackMetadata } from '../../triggers/missing';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/tracks';
import { Axios, AxiosResponse, AxiosError } from 'axios';
import { DBClient } from '../../db/db';
import { IPFSClient } from '../../clients/ipfs';

// todo: do metadata url calls to get all metadata and add to track record
// todo: postfilter/zora only music&catalog filter/extra noizd calls/extra centralized calls for optimized media

const name = 'addTrackMetadata';
const MAX_CONCURRENT_REQUESTS = 40;

const getMetadataForTrack = (track: Track, timeout: number, axios: Axios, ipfs: IPFSClient): any => {
  if (!track.tokenMetadataURI) {
    throw new Error('Track tokenMetadataURI missing');
  }
  let queryURL = track.tokenMetadataURI;
  if (track.metadataIPFSHash) {
    queryURL = ipfs.getHTTPURL(track.metadataIPFSHash);
  }
  console.info(`Querying for metadata: ${queryURL}`)
  return axios.get(queryURL, { timeout });
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
const processorFunction = async (batch: Track[], clients: Clients) => {
  let activeRequests = 0;
  let count = 0;
  console.info(`Processing batch from ${batch[0].id}`);
  const isDone = new Promise(resolve => {
    const fillQueueUntilDone = () => {
      if (activeRequests === 0 && count === batch.length) {
        resolve(true);
      } else {
        while (activeRequests < MAX_CONCURRENT_REQUESTS && count < batch.length) {
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
  saveMetadata(batch, clients.db);
  console.info('Batch done');
  // todo: should have some way to skip/detect/error on buggy urls and ideally continue and ignore them.
  // todo: ensure filtering for trigger working properly
  // maybe an error field inserted into the record so it can be skipped?
  // todo: should upsert
};

export const addTrackMetadata: Processor = {
  name,
  trigger: missingTrackMetadata,
  processorFunction,
  initialCursor: undefined
};
