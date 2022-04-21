import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, Provider } from 'ethcall';
import { BigNumber, ethers } from 'ethers';
import MetaABI from '../abis/MetaABI.json';
import { rollPromises } from '../utils/rollingPromises';

export enum ValidContractCallFunction {
  tokenURI = "tokenURI",
  tokenMetadataURI = "tokenMetadataURI"
}

export type EthCall = {
  contractAddress: string,
  callFunction: ValidContractCallFunction,
  callInput: string,
}

export type EthClient = {
  call: (ethCalls: EthCall[]) => Promise<unknown[]>;
  getERC721TransferEventsFrom: (fromBlock: string, toBlock: string, contractAddress: string) => Promise<ethers.Event[]>;
  getBlockTimestamps:  (blockHashes: string[]) => Promise<number[]>;
  getLatestBlockNumber: () => Promise<number>;
}

const init = async ():Promise<EthClient> => {
  const provider = new JsonRpcProvider(process.env.ETHEREUM_PROVIDER_ENDPOINT);
  const ethcallProvider = new Provider();
  await ethcallProvider.init(provider);
  return {
    call: async (ethCalls: EthCall[]) => {
      const calls = ethCalls.map(ethCall => {
        const contract = new Contract(ethCall.contractAddress, MetaABI.abi);
        const call = contract[ethCall.callFunction](ethCall.callInput);
        return call;
      })
      const data = await ethcallProvider.tryAll(calls);
      return data;
    },
    getERC721TransferEventsFrom: async (fromBlock: string, toBlock: string, contractAddress: string) => {
      const contract = new ethers.Contract(contractAddress, MetaABI.abi, provider);
      const filter = contract.filters.Transfer();
      const events = await contract.queryFilter(filter, BigNumber.from(fromBlock).toHexString(), BigNumber.from(toBlock).toHexString());
      return events;
    },
    getLatestBlockNumber:  async () => {
      return await provider.getBlockNumber();
    },
    getBlockTimestamps:  async (blockHashes: string[]) => {
      const getBlockByHash = provider.getBlock.bind(provider);
      const results = await rollPromises(blockHashes, getBlockByHash);
      const failedBlocks = results.filter(result=>result.isError);
      if (failedBlocks.length !== 0) {
        throw new Error('Failed to get all block timestamps');
      }
      return results.map(result => result.response!.timestamp);
    }
  }
}

export default {
  init
};
