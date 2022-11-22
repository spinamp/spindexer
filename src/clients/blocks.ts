import _ from 'lodash';

import { DBClient, Table } from '../db/db';
import { Block } from '../types/block';
import { ChainId } from '../types/chain';

import { EVMClient } from './evm';


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
      const existingBlocks = await dbClient.getRecords<Block>(Table.blocks, [
        ['where', ['chainId', chainId]],
        ['whereIn', ['blockNumber', blockNumbers]]
      ])
      console.log(`using ${existingBlocks.length} blocks from cache`)
      const existingBlocksByBlockNumber = _.keyBy(existingBlocks, 'blockNumber');

      const missingBlockNumbers = blockNumbers.filter(blockNumber => !existingBlocksByBlockNumber[blockNumber]);
      let newBlocks: Block[] = [];

      const blockNumbersParsed: number[] = missingBlockNumbers.map(blockNumber => parseInt(blockNumber))

      const newBlockTimestampsByBlockNumber = await evmClients[chainId].getBlockTimestampsByBlockNumber(blockNumbersParsed);

      newBlocks = Object.keys(newBlockTimestampsByBlockNumber).map(blockNumber => ({
        chainId,
        blockNumber,
        timestamp: new Date(parseInt(newBlockTimestampsByBlockNumber[blockNumber]) * 1000)
      }))

      const timestampsByBlockNumber = newBlockTimestampsByBlockNumber

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
