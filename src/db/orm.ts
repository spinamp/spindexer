import { Record, RecordUpdate } from '../types/record';
import { Track } from '../types/track';

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
  tracks: (tracks: Record[]): Track[] => tracks.map((t: any) => {
    const metadata = typeof t.metadata === 'object' ? t.metadata : JSON.parse(t.metadata);
    return ({ ...t, metadata });
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
