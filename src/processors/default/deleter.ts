import { Table } from '../../db/db';
import { ignoredNFTs } from '../../triggers/ignored';
import { nonAudioMetadata } from '../../triggers/nonAudio';
import { Clients, Processor } from '../../types/processor';
import { Record } from '../../types/record';

const deleteRecords = (tableName:Table, processorName:string, idField: string = 'id') => async (records: Record[], clients: Clients) => {
  const ids:string[] = records.map(r => (r as any)[idField]);
  await processDelete(tableName, processorName, ids, clients);
};

const deleteRecordIds = (tableName:Table, processorName:string) => async (ids: string[], clients: Clients) => {
  await processDelete(tableName, processorName, ids, clients);
};

const processDelete = async (tableName:Table, processorName:string, ids: string[], clients: Clients) => {
  console.log(`Processing deletes for records with ids: ${ids}`);
  await clients.db.delete(tableName, ids);
  await clients.db.updateProcessor(processorName, 'true');
  console.log('Deleted');
};

export const stripNonAudio: Processor = {
  name: 'stripNonAudio',
  trigger: nonAudioMetadata,
  processorFunction: deleteRecords(Table.erc721nfts, 'stripNonAudio'),
  initialCursor: undefined
};

export const stripIgnoredNFTs: Processor = {
  name: 'stripIgnoredNFTs',
  trigger: ignoredNFTs,
  processorFunction: deleteRecordIds(Table.erc721nfts, 'stripIgnoredNFTs'),
  initialCursor: undefined
};
