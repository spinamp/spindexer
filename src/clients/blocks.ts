import { gql, GraphQLClient } from 'graphql-request';
import _ from 'lodash';

import { ChainId } from '../types/chain';

import { EVMClient } from './evm';

const blocksAPI = new GraphQLClient(process.env.BLOCKS_SUBGRAPH_ENDPOINT!);

export type BlocksClient = {
  fetchBlockTimestamps: (chainId: ChainId, blockNumbers: string[]) => Promise<{ [blockNumber: string]: string }>;
}

const init = async (evmClients: { [chainId in ChainId]: EVMClient }) => {
  return {
    fetchBlockTimestamps: async (
      chainId: ChainId,
      blockNumbers: string[],
    ): Promise<{ [blockNumber: string]: string }> => {
      let result = {};

      // only using the graph for Ethereum. All other EVM chains will use RPC calls
      if (chainId === ChainId.ethereum){
        const blockNumbersForQuery = JSON.stringify(blockNumbers);
        const { blocks } = await blocksAPI.request(
          gql`
          {
            blocks(first:${blockNumbers.length}, where: {number_in: ${blockNumbersForQuery}}) {
              number
              timestamp
            }
          }
          `,
        );
        
        const responseByBlockNumber = _.keyBy(blocks, 'number');
        const blockTimes = _.mapValues(responseByBlockNumber, response => response.timestamp)
        result = blockTimes;
      } else {
        const blockNumbersParsed: number[] = blockNumbers.map(blockNumber => parseInt(blockNumber))

        const blocks = await evmClients[chainId].getBlockTimestampsByBlockNumber(blockNumbersParsed);
        result = blocks
      }

      return result;
    }
  }
}

export default {
  init
};
