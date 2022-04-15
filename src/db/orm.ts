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
