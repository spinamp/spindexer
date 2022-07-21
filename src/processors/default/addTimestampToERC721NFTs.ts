import _ from 'lodash';

import { Table } from '../../db/db';
import { missingCreatedAtTime } from '../../triggers/missing';
import { Clients } from '../../types/processor';
import { Record } from '../../types/record';

const processorFunction = (table: Table) => async (items: Record, clients: Clients) => {
  const recordsByBlockNumber = _.groupBy(items, 'createdAtEthereumBlockNumber');
  const blockNumbers = Object.keys(recordsByBlockNumber);
  console.log(`Processing until block ${blockNumbers[blockNumbers.length - 1]}`)
  const timestampsResponse = await clients.blocks.fetchBlockTimestamps(blockNumbers);
  const responseByBlockNumber = _.keyBy(timestampsResponse, 'number');
  const recordUpdates: Partial<Record>[] = [];
  blockNumbers.forEach((blockNumber) => {
    const timestampMillis = BigInt(responseByBlockNumber[blockNumber].timestamp) * BigInt(1000);
    const records: Record[] = recordsByBlockNumber[blockNumber] as any;
    records.forEach(record => recordUpdates.push({
      id: record.id,
      createdAtTime: new Date(parseInt(timestampMillis.toString())),
    }));
  })
  await clients.db.update(table, recordUpdates);
};

export const addTimestampToERC721NFTs = {
  name: 'addTimestampToERC721NFTs',
  trigger: missingCreatedAtTime(Table.nfts),
  processorFunction: processorFunction(Table.nfts),
};

export const addTimestampToERC721Transfers = {
  name: 'addTimestampToERC721Transfers',
  trigger: missingCreatedAtTime(Table.erc721Transfers),
  processorFunction: processorFunction(Table.erc721Transfers),
};
