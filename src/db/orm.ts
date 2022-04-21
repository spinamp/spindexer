import { Metadata } from '../types/metadata';
import { Record, RecordUpdate } from '../types/record';

export const toDBRecord = (record: Record | RecordUpdate<unknown>) => {
  if ((record as any).createdAtTime) {
    return { ...record, createdAtTime: (record as any).createdAtTime.toISOString() };
  } else {
    return record;
  }
}

export const toDBRecords = (records: (Record | RecordUpdate<unknown>)[]) => {
  return records.map(record => toDBRecord(record))
}

const recordMapper: any = {
  metadatas: (metadatas: Record[]): Metadata[] => metadatas.map((m: any) => {
    const metadata = typeof m.metadata === 'object' ? m.metadata : JSON.parse(m.metadata);
    return ({ ...m, metadata });
  })
}

export const fromDBRecord = (record: any): Record => {
  return { ...record, createdAtTime: new Date(record.createdAtTime) }
}

export const fromDBRecords = (tableName: string, dbRecords: any[]) => {
  const records: Record[] = dbRecords.map(fromDBRecord);
  if (recordMapper[tableName]) {
    return recordMapper[tableName](records);
  }
  return records;
}
