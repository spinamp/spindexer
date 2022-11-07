import _ from 'lodash';

import { Table } from '../../db/db';
import { ethereumMissingCreatedAtTime } from '../../triggers/missing';
import { ChainId } from '../../types/chain';
import { Clients, Processor } from '../../types/processor';
import { Record } from '../../types/record';

const processorFunction = (chainId: ChainId, table: Table) => async (items: Record, clients: Clients) => {
  const recordsByBlockNumber = _.groupBy(items, 'createdAtEthereumBlockNumber');
  const blockNumbers = Object.keys(recordsByBlockNumber);
  console.log(`Processing until block ${blockNumbers[blockNumbers.length - 1]}`)
  const timestampsByBlockNumber = await clients.blocks.fetchBlockTimestamps(chainId, blockNumbers);
  const recordUpdates: Partial<Record>[] = [];
  blockNumbers.forEach((blockNumber) => {
    const timestampMillis = BigInt(timestampsByBlockNumber[blockNumber]) * BigInt(1000);
    const records: Record[] = recordsByBlockNumber[blockNumber] as any;
    records.forEach(record => recordUpdates.push({
      id: record.id,
      createdAtTime: new Date(parseInt(timestampMillis.toString())),
    }));
  })
  await clients.db.update(table, recordUpdates);
};

export const addTimestampToERC721NFTs: (chainId: ChainId) => Processor =
(chainId) => ({
  name: 'addTimestampToERC721NFTs',
  trigger: ethereumMissingCreatedAtTime(chainId, Table.nfts),
  processorFunction: processorFunction(chainId, Table.nfts),
});

export const addTimestampToERC721Transfers: (chainId: ChainId) => Processor =
(chainId) => ({
  name: 'addTimestampToERC721Transfers',
  trigger: ethereumMissingCreatedAtTime(chainId, Table.erc721Transfers),
  processorFunction: processorFunction(chainId, Table.erc721Transfers),
});
