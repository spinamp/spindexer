
import { EVMClient, getEVMClient, ValidContractNFTCallFunction } from '../../clients/evm';
import { Table } from '../../db/db';
import { unprocessedNFTs } from '../../triggers/missing';
import { ChainId } from '../../types/chain';
import { getNFTContractCalls, NFT, NftFactory } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';

const name = 'getERC721TokenFields';

export const getERC721TokenFields = async (nfts: NFT[], evmClient: EVMClient, erc721ContractsByAddress: { [key: string]: NftFactory }) => {
  const contractCalls = nfts.map(nft => {
    const nftContractTypeName = erc721ContractsByAddress[nft.contractAddress]?.contractType || 'default';
    return getNFTContractCalls(nft, nftContractTypeName)
  });
  const flatContractCalls: {
    contractAddress: string;
    callFunction: ValidContractNFTCallFunction;
    callInput: string;
  }[] = [];
  let flatContractCallsIndex = 0;
  const nftIndexToCalls = contractCalls.map((nftCalls) => {
    const callIndexes: number[] = [];
    nftCalls?.forEach(call => {
      flatContractCalls.push(call);
      callIndexes.push(flatContractCallsIndex)
      flatContractCallsIndex++;
    });
    return callIndexes;
  });
  const callResults = await evmClient.call(flatContractCalls);
  const nftUpdates = nfts.map((nft, index) => {
    console.info(`Processing nft with id ${nft.id}`);
    const nftUpdate: Partial<NFT> = {
      id: nft.id,
    };
    const callIndexes = nftIndexToCalls[index];
    callIndexes.forEach(callIndex => {
      const key = flatContractCalls[callIndex].callFunction;
      const value = callResults[callIndex];
      if (key === ValidContractNFTCallFunction.tokenURI && value === null) {
        nftUpdate.tokenURI = '';
      } else {
        nftUpdate[key] = value as string;
      }
    });
    return nftUpdate;
  });
  return nftUpdates;
};

const processorFunction = (chainId: ChainId, erc721ContractsByAddress: { [key: string]: NftFactory }) => async (nfts: NFT[], clients: Clients) => {
  const nftMetadataUpdates = await getERC721TokenFields(nfts, getEVMClient(chainId, clients), erc721ContractsByAddress);
  await clients.db.update(Table.nfts, nftMetadataUpdates);
};

export const getERC721TokenFieldsProcessor: (chainId: ChainId, erc721ContractsByAddress: { [key: string]: NftFactory }) => Processor =
  (chainId: ChainId, erc721ContractsByAddress: { [key: string]: NftFactory }) => ({
    name,
    trigger: unprocessedNFTs(chainId),
    processorFunction: processorFunction(chainId, erc721ContractsByAddress),
    initialCursor: undefined,
  });
