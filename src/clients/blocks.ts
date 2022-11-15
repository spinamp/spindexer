import { gql, GraphQLClient } from 'graphql-request';
import _ from 'lodash';

import { DBClient, Table } from '../db/db';
import { Block } from '../types/block';
import { ChainId } from '../types/chain';

import { EVMClient } from './evm';

const blocksAPI = new GraphQLClient(process.env.BLOCKS_SUBGRAPH_ENDPOINT!);

export type BlocksClient = {
  fetchBlockTimestamps: (chainId: ChainId, blockNumbers: string[]) => Promise<{ 
    timestampsByBlockNumber: { [blockNumber: string]: string },
    newBlocks: Block[] 
  }>;
}

const init = async (
  evmClients: { [chainId in ChainId]: EVMClient },
  dbClient: DBClient
) => {
  return {
    fetchBlockTimestamps: async (
      chainId: ChainId,
      blockNumbers: string[],
    ): Promise<{ 
      timestampsByBlockNumber: { [blockNumber: string]: string },
      newBlocks: Block[] 
    }> => {
      let timestampsByBlockNumber: { [blockNumber: string]: string } = {};

      const existingBlocks = await dbClient.getRecords<Block>(Table.blocks, [
        ['where', ['chainId', chainId]],
        ['whereIn', ['blockNumber', blockNumbers]]
      ])
      console.log(`using ${existingBlocks.length} blocks from cache`)
      const existingBlocksByBlockNumber = _.keyBy(existingBlocks, 'blockNumber');

      const missingBlockNumbers = blockNumbers.filter(blockNumber => !existingBlocksByBlockNumber[blockNumber]);
      let newBlocks: Block[] = [];

      // only using the graph for Ethereum. All other EVM chains will use RPC calls
      if (chainId === ChainId.ethereum){
        const blockNumbersForQuery = JSON.stringify(missingBlockNumbers);
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

        newBlocks = blocks.map((block: any) => ({
          chainId,
          blockNumber: block.number,
          timestamp: new Date(block.timestamp * 1000)
        }))
        
        const responseByBlockNumber = _.keyBy(blocks, 'number');
        const blockTimes = _.mapValues(responseByBlockNumber, response => response.timestamp)
        timestampsByBlockNumber = blockTimes;
      } else {
        const blockNumbersParsed: number[] = missingBlockNumbers.map(blockNumber => parseInt(blockNumber))

        const blocks = await evmClients[chainId].getBlockTimestampsByBlockNumber(blockNumbersParsed);

        newBlocks = Object.keys(blocks).map(blockNumber => ({
          chainId,
          blockNumber,
          timestamp: new Date(parseInt(blocks[blockNumber]) * 1000)
        }))

        timestampsByBlockNumber = blocks
      }

      for (const block of existingBlocks){
        const blockNumber = block.blockNumber.toString();
        const timestamp = block.timestamp.getTime() / 1000;
        timestampsByBlockNumber[blockNumber] = timestamp.toString()
      }

      return {
        timestampsByBlockNumber,
        newBlocks: newBlocks
      };
    }
  }
}

export default {
  init
};
