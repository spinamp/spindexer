import { Axios, AxiosResponse, AxiosError } from 'axios';

import { IPFSClient } from '../../clients/ipfs';
import { missingMetadataObject } from '../../triggers/missing';
import { getMetadataURL, Metadata } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';
import { rollPromises } from '../../utils/rollingPromises';

const name = 'addMetadataObject';

const getMetadataObject = (metadataRecord: Metadata, timeout: number, axios: Axios, ipfs: IPFSClient): Promise<AxiosResponse> => {
  const metadataURL = getMetadataURL(metadataRecord);
  if (!metadataURL) {
    return Promise.reject({ message:`Metadata metadataURL missing` });
  }
  let queryURL = metadataURL;
  if (metadataRecord.metadataIPFSHash) {
    queryURL = ipfs.getHTTPURL(metadataRecord.metadataIPFSHash);
  }
  console.info(`Querying for metadata for id ${metadataRecord.id}: ${queryURL}`)
  return axios.get(queryURL, { timeout });
}

const processorFunction = async (batch: Metadata[], clients: Clients) => {

  const processMetadataResponse = (metadata:Metadata) =>
    getMetadataObject(metadata, parseInt(process.env.METADATA_REQUEST_TIMEOUT!), clients.axios, clients.ipfs);

  const results = await rollPromises<Metadata, AxiosResponse, AxiosError>(batch, processMetadataResponse);

  const metadataUpdates = batch.map((metadataRecord, index): ({ id: string } & Partial<Metadata>) => {
    const metadata = results[index].response? results[index].response!.data : undefined;
    const metadataError = results[index].isError? results[index].error!.message : undefined;
    return {
      id: metadataRecord.id,
      metadata: metadata? JSON.stringify(metadata) : null,
      mimeType: metadata? metadata.mimeType : null,
      metadataError,
    }
  });
  await clients.db.update('metadatas', metadataUpdates);
  console.info('Batch done');
};

export const addMetadataObjectProcessor: Processor = {
  name,
  trigger: missingMetadataObject,
  processorFunction,
  initialCursor: undefined
};
