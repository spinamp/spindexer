import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, Provider } from 'ethcall';
import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import MetaABI from '../abis/MetaABI.json';
import { rollPromises } from '../utils/rollingPromises';

export enum ValidContractCallFunction {
  tokenURI = 'tokenURI',
  tokenMetadataURI = 'tokenMetadataURI'
}

export type EthCall = {
  contractAddress: string,
  callFunction: ValidContractCallFunction,
  callInput: string,
}

export type EthClient = {
  call: (ethCalls: EthCall[]) => Promise<unknown[]>;
  getEventsFrom: (fromBlock: string, toBlock: string, contractFilters: ContractFilter[]) => Promise<ethers.Event[]>;
  getBlockTimestamps:  (blockHashes: string[]) => Promise<number[]>;
  getLatestBlockNumber: () => Promise<number>;
}

export type ContractFilter = {
  address: string,
  filter: string
};

const init = async (): Promise<EthClient> => {
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
    getEventsFrom: async (fromBlock: string, toBlock: string, contractFilters: ContractFilter[]) => {
      const filters = contractFilters.map(contractFilter => {
        const contract = new ethers.Contract(contractFilter.address, MetaABI.abi, provider);
        const filter = contract.filters[contractFilter.filter]();
        return filter.topics![0];
      });
      const contractAddresses = _.uniq(contractFilters.map(c => c.address));
      const events = await provider.send('eth_getLogs', [{
        address: contractAddresses,
        topics: [
          [ // topic[0]
            ...filters
          ]
        ],
        fromBlock: BigNumber.from(fromBlock).toHexString(),
        toBlock: BigNumber.from(toBlock).toHexString(),
      }]);
      const iface = new ethers.utils.Interface(MetaABI.abi);
      return events.map((event: ethers.Event) => ({
        ...iface.parseLog(event),
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
