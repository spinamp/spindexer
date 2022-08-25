import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, Provider } from 'ethcall';
import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import MetaABI from '../abis/MetaABI.json';
import { rollPromises } from '../utils/rollingPromises';

export enum ValidContractNFTCallFunction {
  tokenURI = 'tokenURI',
  tokenMetadataURI = 'tokenMetadataURI',
}

export enum ValidContractCallFunction {
  name = 'name',
  symbol = 'symbol'
}

export type EthCall = {
  contractAddress: string,
  callFunction: ValidContractNFTCallFunction | ValidContractCallFunction,
  callInput?: string,
}

type returnType = ethers.utils.LogDescription & {
  logIndex: string,
  blockNumber: string,
  blockHash: string,
  address: string
}

export type EthClient = {
  call: (ethCalls: EthCall[]) => Promise<unknown[]>;
  getEventsFrom: (fromBlock: string, toBlock: string, contractFilters: ContractFilter[]) => Promise<returnType[]>;
  getBlockTimestamps: (blockHashes: string[]) => Promise<number[]>;
  getLatestBlockNumber: () => Promise<number>;
}

export type ContractFilter = {
  address: string,
  filter: string
};

const init = async (): Promise<EthClient> => {
  const provider = new JsonRpcProvider({ url: process.env.ETHEREUM_PROVIDER_ENDPOINT!, timeout: 120000 });
  const ethcallProvider = new Provider();
  await ethcallProvider.init(provider);
  return {
    call: async (ethCalls: EthCall[]) => {
      const calls = ethCalls.map(ethCall => {
        const contract = new Contract(ethCall.contractAddress, MetaABI.abi);
        const call = ethCall.callInput ? contract[ethCall.callFunction](ethCall.callInput) : contract[ethCall.callFunction]();
        return call;
      })
      const data = await ethcallProvider.tryAll(calls);
      return data;
    },
    getEventsFrom: async (fromBlock: string, toBlock: string, contractFilters: ContractFilter[]) => {
      const filters = contractFilters.map(contractFilter => {
        const contract = new ethers.Contract(contractFilter.address, MetaABI.abi, provider);
        const filter = contract.filters[contractFilter.filter]();
        return filter.topics![0];
      });
      const contractAddresses = _.uniq(contractFilters.map(c => c.address));

      // split into ranges of MAX_BLOCK_RANGE  blocks
      const maxRange = Number(process.env.MAX_BLOCK_RANGE!);
      const range = Number(toBlock) - Number(fromBlock);
      const numberOfRanges = Math.ceil(
        range / Number(maxRange)
      );

      const ranges = Array(numberOfRanges).fill(0).map((value, index) => {
        const from = Number(fromBlock) + maxRange * index;
        const to = Math.min(from + maxRange, Number(toBlock))
        return {
          from, 
          to
        }
      })

      const promises = ranges.map(async ({ from, to }) => {
        return provider.send('eth_getLogs', [{
          address: contractAddresses,
          topics: [
            [ 
              ...filters
            ]
          ],
          fromBlock: BigNumber.from(from).toHexString(),
          toBlock: BigNumber.from(to).toHexString(),
        }]);
      })

      let events = await Promise.all(promises);
      events = [].concat(...events);

      const iface = new ethers.utils.Interface(MetaABI.abi);
      return events.map((event: ethers.Event) => ({
        ...iface.parseLog(event),
        logIndex: BigNumber.from(event.logIndex).toString(),
        blockNumber: BigNumber.from(event.blockNumber).toString(),
        blockHash: event.blockHash,
        address: event.address
      }));
    },
    getLatestBlockNumber: async () => {
      return await provider.getBlockNumber();
    },
    getBlockTimestamps: async (blockHashes: string[]) => {
      const getBlockByHash = provider.getBlock.bind(provider);
      const results = await rollPromises(blockHashes, getBlockByHash);
      const failedBlocks = results.filter(result => result.isError);
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
