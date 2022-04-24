import _ from 'lodash';

import { EthClient, ValidContractCallFunction } from '../../clients/ethereum';
import { DBClient } from '../../db/db';
import { unprocessedNFTs } from '../../triggers/missing';
import { formatAddress } from '../../types/address';
import { getNFTContractCalls, ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract, NFTContractTypes } from '../../types/ethereum';
import { Metadata } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';

const name = 'createMetadatasFromNFTs';

export const createMetadatasFromNFTs = async (nfts: ERC721NFT[], dbClient: DBClient, ethClient: EthClient, erc721ContractsByAddress: {[key:string]:ERC721Contract}) => {
  const contractCalls = nfts.map(nft => {
    const nftContractTypeName = erc721ContractsByAddress[nft.contractAddress]?.contractType || 'default';
    return getNFTContractCalls(nft, nftContractTypeName)
  });
  const flatContractCalls: {
    contractAddress: string;
    callFunction: ValidContractCallFunction;
    callInput: string;
  }[] = [];
  let flatContractCallsIndex = 0;
  const nftIndexToCalls = contractCalls.map((nftCalls) => {
    const callIndexes: number[] = [];
    nftCalls.forEach(call => {
      flatContractCalls.push(call);
      callIndexes.push(flatContractCallsIndex)
      flatContractCallsIndex++;
    });
    return callIndexes;
  });
  const callResults = await ethClient.call(flatContractCalls);
  const newMetadatas = nfts.map((nft, index) => {
    console.info(`Processing nft with id ${nft.id}`);
    const metadata: Metadata = {
      nftId: nft.id,
      platformId: nft.platformId,
    };
    const callIndexes = nftIndexToCalls[index];
    callIndexes.forEach(callIndex => {
      const key = flatContractCalls[callIndex].callFunction;
      const value = callResults[callIndex];
      metadata[key] = value as string;
    });
    return metadata;
  });
  return newMetadatas;
};

const processorFunction = (erc721ContractsByAddress: {[key:string]:ERC721Contract}) => async (nfts: ERC721NFT[], clients: Clients) => {
  const newMetadatas = await createMetadatasFromNFTs(nfts, clients.db, clients.eth, erc721ContractsByAddress);
  await clients.db.insert('metadatas', newMetadatas);
};

export const createMetadatasFromNFTsProcessor: (erc721ContractsByAddress: {[key:string]:ERC721Contract}) => Processor =
(erc721ContractsByAddress: {[key:string]:ERC721Contract}) => ({
  name,
  trigger: unprocessedNFTs,
  processorFunction: processorFunction(erc721ContractsByAddress),
  initialCursor: undefined,
});
