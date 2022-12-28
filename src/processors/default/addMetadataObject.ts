import { Axios } from 'axios';

import { IPFSClient } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { missingMetadataObject } from '../../triggers/missing';
import { getMetadataFromURI } from '../../types/metadata';
import { getNFTMetadataURL, NFT, NftFactory } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { rollPromises } from '../../utils/rollingPromises';

const name = 'addMetadataObject';

const getNFTMetadata = async (nft: NFT, timeout: number, axios: Axios, ipfs: IPFSClient, erc721ContractsByAddress: { [key: string]: NftFactory }): Promise<{
  metadata?: any,
  metadataError?: any
}> => {
  const address = nft.contractAddress;
  const nftFactory = erc721ContractsByAddress[address];

  const uri = await getNFTMetadataURL(nft, nftFactory, ipfs);
  if (!uri) {
    return Promise.reject({ message: `Metadata metadataURL missing` });
  }

  console.info(`Querying for metadata for nft id ${nft.id}: ${uri}`)
  const response = await getMetadataFromURI(uri, axios, timeout);

  return {
    metadata: response.data,
    metadataError: response.error
  };
}

const processorFunction = (erc721ContractsByAddress: { [key: string]: NftFactory }) => async (batch: NFT[], clients: Clients) => {

  const processMetadataResponse = (nft: NFT) =>
    getNFTMetadata(nft, parseInt(process.env.METADATA_REQUEST_TIMEOUT!), clients.axios, clients.ipfs, erc721ContractsByAddress);

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
