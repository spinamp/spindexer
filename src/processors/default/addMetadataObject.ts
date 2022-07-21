import { Axios, AxiosResponse, AxiosError } from 'axios';

import { IPFSClient } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { missingMetadataObject } from '../../triggers/missing';
import { NftFactory } from '../../types/ethereum';
import { getMetadataURL } from '../../types/metadata';
import { NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { rollPromises } from '../../utils/rollingPromises';

const name = 'addMetadataObject';

const getMetadataObject = (nft: NFT, timeout: number, axios: Axios, ipfs: IPFSClient, erc721ContractsByAddress: { [key: string]: NftFactory }): Promise<AxiosResponse> => {
  const address = nft.contractAddress;
  const contract = erc721ContractsByAddress[address];
  const contractTypeName = contract?.contractType;

  const metadataURL = getMetadataURL(nft, contractTypeName);
  if (!metadataURL) {
    return Promise.reject({ message: `Metadata metadataURL missing` });
  }
  let queryURL = metadataURL;
  if (nft.metadataIPFSHash) {
    queryURL = ipfs.getHTTPURL(nft.metadataIPFSHash);
  }
  console.info(`Querying for metadata for nft id ${nft.id}: ${queryURL}`)
  return axios.get(queryURL, { timeout });
}

const processorFunction = (erc721ContractsByAddress: { [key: string]: NftFactory }) => async (batch: NFT[], clients: Clients) => {

  const processMetadataResponse = (nft: NFT) =>
    getMetadataObject(nft, parseInt(process.env.METADATA_REQUEST_TIMEOUT!), clients.axios, clients.ipfs, erc721ContractsByAddress);

  const results = await rollPromises<NFT, AxiosResponse, AxiosError>(batch, processMetadataResponse);

  const metadataErrors: { metadataError: string, erc721nftId: string }[] = [];
  const nftUpdates = batch.map((nft, index): (Partial<NFT>) => {
    const metadata = results[index].response ? results[index].response!.data : undefined;
    const metadataError = results[index].isError ? results[index].error!.message : undefined;
    if (metadataError){
      metadataErrors.push({
        erc721nftId: nft.id, 
        metadataError
      });
    }
    return {
      id: nft.id,
      metadata: metadata ? JSON.stringify(metadata) : null,
      mimeType: metadata ? metadata.mimeType : null,
    }
  });
  await clients.db.update(Table.erc721nfts, nftUpdates);
  await clients.db.upsert(Table.erc721nftProcessErrors,metadataErrors, 'erc721nftId');

  console.info('Batch done');
};

export const addMetadataObjectProcessor: (erc721ContractsByAddress: { [key: string]: NftFactory }) => Processor =
  (erc721ContractsByAddress: { [key: string]: NftFactory }) => ({
    name,
    trigger: missingMetadataObject,
    processorFunction: processorFunction(erc721ContractsByAddress),
    initialCursor: undefined
  });
