import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, Provider } from 'ethcall';
import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import MetaABI from '../abis/MetaABI.json';
import { ChainId } from '../types/chain';
import { Clients } from '../types/processor';
import { rollPromises } from '../utils/rollingPromises';

export enum ValidContractNFTCallFunction {
  tokenURI = 'tokenURI',
  tokenMetadataURI = 'tokenMetadataURI',
}

export enum ValidContractCallFunction {
  name = 'name',
  symbol = 'symbol'
}

export type EVMCall = {
  contractAddress: string,
  callFunction: ValidContractNFTCallFunction | ValidContractCallFunction,
  callInput?: string,
}

type Events = ethers.utils.LogDescription & {
  logIndex: string,
  blockNumber: string,
  blockHash: string,
  address: string
  transactionHash: string;
}

export function getEVMClient(chainId: ChainId | string, clients: Clients): EVMClient {
  const client = clients.evmChain[chainId as ChainId];

  if (!client){
    throw `Can't find evm client for chain ${chainId}`
  }

  return client
}

export type EVMClient = {
  call: (ethCalls: EVMCall[]) => Promise<unknown[]>;
  getEventsFrom: (fromBlock: string, toBlock: string, contractFilters: ContractFilter[]) => Promise<Events[]>;
  getBlockTimestamps: (blockHashes: string[]) => Promise<number[]>;
  getLatestBlockNumber: () => Promise<number>;
  getContractOwner: (hash: string) => Promise<string>;
  getBlockTimestampsByBlockNumber: (blockNumbers: number[]) => Promise<{ [blockNumber: string]: string }>;
}

export type ContractFilter = {
  address: string,
  filter: string,
  filterArgs?: any[]
};

async function getLogs(provider: JsonRpcProvider, params: any, fromBlock: string, toBlock: string){
  const events = [];
  let start = BigNumber.from(fromBlock).toHexString();
  let end = BigNumber.from(toBlock).toHexString();
  let readUntil = '0';
  while (BigNumber.from(toBlock).gt(readUntil)){
    try {
      const eventRange = await provider.send('eth_getLogs', [{
        ...params,
        fromBlock: start,
        toBlock: end
      }]);

      events.push(...eventRange)
      readUntil = end;
      start = BigNumber.from(end).add(1).toHexString();
      end = BigNumber.from(toBlock).toHexString();
    } catch (e: any){
      const errorString = e.toString() as string;
      const searchString = 'this block range should work: [';
      if (!errorString.includes(searchString)){
        const range = BigNumber.from(end).sub(start);
        const newRange = Math.floor(range.div(2).toNumber());
        end = BigNumber.from(start).add(newRange).toHexString();
        console.log(`Can't find suggested range, decrease range by half. fromBlock:`, BigNumber.from(start).toNumber(), 'toBlock:', BigNumber.from(end).toNumber() )

        if (start === end){
          'throw error fetching logs unrelated to block range'
        }

      } else {
        const suggestion = errorString.substring(errorString.indexOf(searchString), errorString.indexOf(']\\"}}",'));
        const suggestedRanges = suggestion.substring(suggestion.indexOf('[') + 1).split(', ')
        if (suggestedRanges.length !== 2){
          throw `Can't find suggested block range`
        }
        start = suggestedRanges[0];
        end = suggestedRanges[1];
      }
    }
  }

  return events
}

const init = async (providerUrl: string): Promise<EVMClient> => {
  const provider = new JsonRpcProvider(providerUrl);
  const ethcallProvider = new Provider();
  await ethcallProvider.init(provider);
  return {
    call: async (ethCalls: EVMCall[]) => {
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
        const args = contractFilter.filterArgs || []
        const filter = contract.filters[contractFilter.filter](...args);
        return filter.topics;
      });
      const contractAddresses = _.uniq(contractFilters.map(c => c.address));

      const zippedFilters = _.zip(...filters)
      const topics = zippedFilters.map(filter => {
        return _.uniq(filter)
      }).map(topic => {
        if (topic.length === 1 && topic[0] === null){
          return null
        }  
        return topic
      });

      const args = {
        address: contractAddresses,
        topics
      }

      const events = await getLogs(provider, args, fromBlock, toBlock)
      const iface = new ethers.utils.Interface(MetaABI.abi);
      return events.map((event: ethers.Event) => ({
        ...iface.parseLog(event),
        logIndex: BigNumber.from(event.logIndex).toString(),
        blockNumber: BigNumber.from(event.blockNumber).toString(),
        blockHash: event.blockHash,
        address: event.address,
        transactionHash: event.transactionHash
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
    },
    getContractOwner: async(hash) => {
      const contract = new ethers.Contract(hash, MetaABI.abi, provider);
      const owner = await contract.owner();
      return owner
    },
    getBlockTimestampsByBlockNumber: async (blockNumbers: number[]): Promise<{ [blockNumber: string]: string }> => {
      const getBlock = provider.getBlock.bind(provider);
      const results = await rollPromises(blockNumbers, getBlock);
      const failedBlocks = results.filter(result => result.isError);
      if (failedBlocks.length !== 0) {
        throw new Error('Failed to get all block timestamps');
      }

      const timesByBlockNumber: { [blockNumber: string]: string } = {}
      for (const block of results){
        timesByBlockNumber[block.response!.number.toString()] = block.response!.timestamp.toString()
      }
      return timesByBlockNumber
    }
  }
}

export default {
  init
};
