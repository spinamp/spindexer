import { ERC721Contract } from '../types/ethereum';
import { Metadata } from '../types/metadata';
import { IdField, Record, RecordUpdate } from '../types/record';

export const toDBRecord = <RecordType>(record: RecordType | RecordUpdate<unknown>) => {
  if ((record as any).createdAtTime) {
    return { ...record, createdAtTime: (record as any).createdAtTime.toISOString() };
  } else {
    return record;
  }
}

const toRecordMapper: any = {
  erc721Contracts: (erc721Contracts: ERC721Contract[]): IdField[] => erc721Contracts.map((c: any) => {
    return ({
      id: c.address,
      platformId: c.platform,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
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
  metadatas: (metadatas: Record[]): Metadata[] => metadatas.map((m: any) => {
    const metadata = typeof m.metadata === 'object' ? m.metadata : JSON.parse(m.metadata);
    return ({ ...m, metadata });
  }),
  erc721Contracts: (erc721Contracts: Record[]): ERC721Contract[] => erc721Contracts.map((c: any) => {
    return ({
      address: c.id,
      platform: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
    });
  }),
  factoryContracts: (factoryContracts: Record[]): ERC721Contract[] => factoryContracts.map((c: any) => {
    return ({
      address: c.id,
      platform: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      gap: c.gap,
    });
  }),
}

export const fromDBRecord = (record: any): Record => {
  return { ...record, createdAtTime: record.createdAtTime? new Date(record.createdAtTime) : null }
}

export const fromDBRecords = (tableName: string, dbRecords: any[]) => {
  const records: Record[] = dbRecords.map(fromDBRecord);
  if (fromRecordMapper[tableName]) {
    return fromRecordMapper[tableName](records);
  }
  return records;
}
