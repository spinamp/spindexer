import _ from 'lodash';

import { EthClient, ValidContractCallFunction } from '../../clients/ethereum';
import { DBClient, Table } from '../../db/db';
import { unprocessedNFTs } from '../../triggers/missing';
import { formatAddress } from '../../types/address';
import { getNFTContractCalls, ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract, NFTContractTypes } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';

const name = 'createMetadatasForNFTs';

export const createMetadatasForNFTs = async (nfts: ERC721NFT[], ethClient: EthClient, erc721ContractsByAddress: {[key:string]:ERC721Contract}) => {
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
  const nftMetadataUpdates = nfts.map((nft, index) => {
    console.info(`Processing nft with id ${nft.id}`);
    const nftUpdate: Partial<ERC721NFT> = {
      id: nft.id,
      platformId: nft.platformId,
    };
    const callIndexes = nftIndexToCalls[index];
    callIndexes.forEach(callIndex => {
      const key = flatContractCalls[callIndex].callFunction;
      const value = callResults[callIndex];
      nftUpdate[key] = value as string;
    });
    return nft;
  });
  return nftMetadataUpdates;
};

const processorFunction = (erc721ContractsByAddress: {[key:string]:ERC721Contract}) => async (nfts: ERC721NFT[], clients: Clients) => {
  const nftMetadataUpdates = await createMetadatasForNFTs(nfts, clients.eth, erc721ContractsByAddress);
  await clients.db.insert(Table.erc721nfts, nftMetadataUpdates);
};

export const createMetadatasForNFTsProcessor: (erc721ContractsByAddress: {[key:string]:ERC721Contract}) => Processor =
(erc721ContractsByAddress: {[key:string]:ERC721Contract}) => ({
  name,
  trigger: unprocessedNFTs,
  processorFunction: processorFunction(erc721ContractsByAddress),
  initialCursor: undefined,
});
