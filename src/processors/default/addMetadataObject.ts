import { Axios, AxiosResponse, AxiosError } from 'axios';

import { IPFSClient } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { missingMetadataObject } from '../../triggers/missing';
import { ERC721NFT } from '../../types/erc721nft';
import { getMetadataURL } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';
import { rollPromises } from '../../utils/rollingPromises';

const name = 'addMetadataObject';

const getMetadataObject = (nft: ERC721NFT, timeout: number, axios: Axios, ipfs: IPFSClient): Promise<AxiosResponse> => {
  const metadataURL = getMetadataURL(nft);
  if (!metadataURL) {
    return Promise.reject({ message:`Metadata metadataURL missing` });
  }
  let queryURL = metadataURL;
  if (nft.metadataIPFSHash) {
    queryURL = ipfs.getHTTPURL(nft.metadataIPFSHash);
  }
  console.info(`Querying for metadata for nft id ${nft.id}: ${queryURL}`)
  return axios.get(queryURL, { timeout });
}

const processorFunction = async (batch: ERC721NFT[], clients: Clients) => {

  const processMetadataResponse = (nft:ERC721NFT) =>
    getMetadataObject(nft, parseInt(process.env.METADATA_REQUEST_TIMEOUT!), clients.axios, clients.ipfs);

  const results = await rollPromises<ERC721NFT, AxiosResponse, AxiosError>(batch, processMetadataResponse);

  const nftUpdates = batch.map((nft, index): (Partial<ERC721NFT>) => {
    const metadata = results[index].response? results[index].response!.data : undefined;
    const metadataError = results[index].isError? results[index].error!.message : undefined;
    return {
      id: nft.id,
      metadata: metadata? JSON.stringify(metadata) : null,
      mimeType: metadata? metadata.mimeType : null,
      metadataError,
    }
  });
  await clients.db.update(Table.erc721nfts, nftUpdates);
  console.info('Batch done');
};

export const addMetadataObjectProcessor: Processor = {
  name,
  trigger: missingMetadataObject,
  processorFunction,
  initialCursor: undefined
};
