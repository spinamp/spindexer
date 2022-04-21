import { Axios, AxiosResponse, AxiosError } from 'axios';

import { IPFSClient } from '../../clients/ipfs';
import { DBClient } from '../../db/db';
import { missingMetadataObject } from '../../triggers/missing';
import { getMetadataURL, Metadata } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';

const name = 'addMetadataObject';

const getMetadataObject = (metadataRecord: Metadata, timeout: number, axios: Axios, ipfs: IPFSClient): any => {
  const metadataURL = getMetadataURL(metadataRecord);
  if (!metadataURL) {
    throw new Error('Metadata metadataURL missing');
  }
  let queryURL = metadataURL;
  if (metadataRecord.metadataIPFSHash) {
    queryURL = ipfs.getHTTPURL(metadataRecord.metadataIPFSHash);
  }
  console.info(`Querying for metadata: ${queryURL}`)
  return axios.get(queryURL, { timeout });
}

const saveMetadata = async (metadatas: Metadata[], dbClient: DBClient) => {
  const metadataUpdates = metadatas.map((metadataRecord): ({ id: string } & Partial<Metadata>) => ({
    id: metadataRecord.id,
    metadata: metadataRecord.metadata ? JSON.stringify(metadataRecord.metadata) : null,
    mimeType: metadataRecord.metadata?.mimeType,
    metadataError: metadataRecord.metadataError,
  }));
  await dbClient.update('metadatas', metadataUpdates);
}

// This function effectively gets a batch of metadatas to process. It then sets up a buffer
// of concurrent requests and flushes metadata requests through until all metadatas have
// been processed or timed out. It then updates all those metadata objects in the DB.
// todo: should probably be abstracted out/generalized
const processorFunction = async (batch: Metadata[], clients: Clients) => {
  let activeRequests = 0;
  let count = 0;
  console.info(`Processing batch from ${batch[0].id}`);
  const isDone = new Promise(resolve => {
    const fillQueueUntilDone = () => {
      if (activeRequests === 0 && count === batch.length) {
        resolve(true);
      } else {
        while (activeRequests < parseInt(process.env.MAX_CONCURRENT_ROLLING_REQUESTS!) && count < batch.length) {
          const metadata = batch[count];
          console.info(`Processing metadata ${count} with id ${metadata.id}`);
          getMetadataObject(metadata, parseInt(process.env.METADATA_REQUEST_TIMEOUT!), clients.axios, clients.ipfs).then((response: AxiosResponse) => {
            metadata.metadata = response.data;
            activeRequests--;
          }).catch((error: AxiosError) => {
            console.log({ error: error.message, headers: error.response?.headers })
            metadata.metadataError = error.message;
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

export const addMetadataObjectProcessor: Processor = {
  name,
  trigger: missingMetadataObject,
  processorFunction,
  initialCursor: undefined
};
