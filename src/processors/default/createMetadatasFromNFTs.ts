import _ from 'lodash';

import { EthClient, ValidContractCallFunction } from '../../clients/ethereum';
import { Table } from '../../db/db';
import { unprocessedNFTs } from '../../triggers/missing';
import { getNFTContractCalls, ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';

const name = 'getERC721TokenFields';

export const getERC721TokenFields = async (nfts: ERC721NFT[], ethClient: EthClient, erc721ContractsByAddress: { [key: string]: ERC721Contract }) => {
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
  const nftUpdates = nfts.map((nft, index) => {
    console.info(`Processing nft with id ${nft.id}`);
    const nftUpdate: Partial<ERC721NFT> = {
      id: nft.id,
    };
    const callIndexes = nftIndexToCalls[index];
    callIndexes.forEach(callIndex => {
      const key = flatContractCalls[callIndex].callFunction;
      const value = callResults[callIndex];
      if (key === ValidContractCallFunction.tokenURI && value === null) {
        nftUpdate.tokenURI = '';
      } else {
        nftUpdate[key] = value as string;
      }
    });
    return nftUpdate;
  });
  return nftUpdates;
};

const processorFunction = (erc721ContractsByAddress: { [key: string]: ERC721Contract }) => async (nfts: ERC721NFT[], clients: Clients) => {
  const nftMetadataUpdates = await getERC721TokenFields(nfts, clients.eth, erc721ContractsByAddress);
  await clients.db.update(Table.erc721nfts, nftMetadataUpdates);
};

export const getERC721TokenFieldsProcessor: (erc721ContractsByAddress: { [key: string]: ERC721Contract }) => Processor =
(erc721ContractsByAddress: { [key: string]: ERC721Contract }) => ({
  name,
  trigger: unprocessedNFTs,
  processorFunction: processorFunction(erc721ContractsByAddress),
  initialCursor: undefined,
});
