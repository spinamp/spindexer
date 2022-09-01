import { Axios } from 'axios';

import { IPFSClient } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { missingMetadataObject } from '../../triggers/missing';
import { getMetadataURL } from '../../types/metadata';
import { NFT, NftFactory } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { rollPromises } from '../../utils/rollingPromises';

const name = 'addMetadataObject';

const getMetadataObject = async (nft: NFT, timeout: number, axios: Axios, ipfs: IPFSClient, erc721ContractsByAddress: { [key: string]: NftFactory }): Promise<{
  metadata?: any,
  metadataError?: any
}> => {
  const address = nft.contractAddress;
  const contract = erc721ContractsByAddress[address];
  const contractTypeName = contract?.contractType;

  const metadataURL = getMetadataURL(nft, contractTypeName);
  if (!metadataURL) {
    return Promise.reject({ message: `Metadata metadataURL missing` });
  }
  
  if (metadataURL.startsWith('data:application/json;base64,')){
    try {

      const base64 = metadataURL.substring(metadataURL.indexOf(',') + 1);
      const data = Buffer.from(base64, 'base64').toString('utf-8')
      const metadata = JSON.parse(data);
      return { metadata };
    } catch (e: any){
      return {
        metadataError: e.toString()
      }
    }
  }
  
  let queryURL = metadataURL;
  if (nft.metadataIPFSHash) {
    queryURL = ipfs.getHTTPURL(nft.metadataIPFSHash);
  }

  console.info(`Querying for metadata for nft id ${nft.id}: ${queryURL}`)
  try {
    const response = await axios.get(queryURL, { timeout });
    return {
      metadata: response.data
    }
  } catch (e: any){
    return {
      metadataError: e.toString()
    }
  }

}

const processorFunction = (erc721ContractsByAddress: { [key: string]: NftFactory }) => async (batch: NFT[], clients: Clients) => {

  const processMetadataResponse = (nft: NFT) =>
    getMetadataObject(nft, parseInt(process.env.METADATA_REQUEST_TIMEOUT!), clients.axios, clients.ipfs, erc721ContractsByAddress);

  const results = await rollPromises<NFT, { metadata?: any, metadataError?: any }, any>(batch, processMetadataResponse);

  const metadataErrors: { metadataError: string, nftId: string }[] = [];
  const nftUpdates = batch.map((nft, index): (Partial<NFT>) => {
    const metadata = results[index].response ? results[index].response!.metadata : undefined;
    const metadataError = results[index].response ? results[index].response!.metadataError : undefined;
    if (metadataError){
      metadataErrors.push({
        nftId: nft.id,
        metadataError
      });
    }
    return {
      id: nft.id,
      metadata: metadata ? JSON.stringify(metadata) : null,
      mimeType: metadata ? metadata.mimeType : null,
    }
  });
  await clients.db.update(Table.nfts, nftUpdates);
  await clients.db.upsert(Table.nftProcessErrors, metadataErrors, 'nftId', ['metadataError']);

  console.info('Batch done');
};

export const addMetadataObjectProcessor: (erc721ContractsByAddress: { [key: string]: NftFactory }) => Processor =
  (erc721ContractsByAddress: { [key: string]: NftFactory }) => ({
    name,
    trigger: missingMetadataObject,
    processorFunction: processorFunction(erc721ContractsByAddress),
    initialCursor: undefined
  });
