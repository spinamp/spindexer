import { NftFactory, FactoryContract } from '../types/ethereum';
import { NFT } from '../types/nft';
import { MusicPlatformType } from '../types/platform';
import { IdField, Record, RecordUpdate } from '../types/record';

import { Table } from './db';

const toDBRecord = <RecordType>(record: RecordType | RecordUpdate<unknown>) => {
  if ((record as any).createdAtTime) {
    return { ...record, createdAtTime: (record as any).createdAtTime.toISOString() };
  } else {
    return record;
  }
}

const toRecordMapper: any = {
  [Table.erc721Contracts]: (erc721Contracts: NftFactory[]): IdField[] => erc721Contracts.map((c: any) => {
    return ({
      id: c.platformId === MusicPlatformType.nina ? c.address : c.address.toLowerCase(),
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      name: c.name,
      symbol: c.symbol,
      typeMetadata: c.typeMetadata,
      standard: c.standard
    });
  }),
  [Table.factoryContracts]: (factoryContracts: FactoryContract[]): IdField[] => factoryContracts.map((c: any) => {
    return ({
      id: c.platformId === MusicPlatformType.nina ? c.address : c.address.toLowerCase(),
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      gap: c.gap
    });
  }),
}

export const toDBRecords = <RecordType>(tableName: string, records: (RecordType | RecordUpdate<unknown>)[]) => {
  const dbRecords = records.map(record => toDBRecord(record));
  if (toRecordMapper[tableName]) {
    return toRecordMapper[tableName](records);
  }
  return dbRecords;
}

const fromRecordMapper: any = {
  [Table.erc721nfts]: (nfts: Record[]): NFT[] => nfts.map((n: any) => {
    const metadata = typeof n.metadata === 'object' ? n.metadata : JSON.parse(n.metadata);
    return ({ ...n, metadata });
  }),
  [Table.erc721Contracts]: (erc721Contracts: Record[]): NftFactory[] => erc721Contracts.map((c: any) => {
    return ({
      address: c.id,
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      name: c.name,
      symbol: c.symbol,
      typeMetadata: c.typeMetadata,
      standard: c.standard
    });
  }),
  [Table.factoryContracts]: (factoryContracts: Record[]): FactoryContract[] => factoryContracts.map((c: any) => {
    return ({
      address: c.id,
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      gap: c.gap,
    });
  }),
}

export const fromDBRecord = (record: any): Record => {
  return { ...record, createdAtTime: record.createdAtTime ? new Date(record.createdAtTime) : null }
}

export const fromDBRecords = (tableName: string, dbRecords: any[]) => {
  const records: Record[] = dbRecords.map(fromDBRecord);
  if (fromRecordMapper[tableName]) {
    return fromRecordMapper[tableName](records);
  }
  return records;
}
