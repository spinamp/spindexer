export type Record = {
  id: string
}

export enum RecordType {
  nft = "nft",
  track = "track"
}

export const recordsEqual = (recordA: Record, recordB: Record) => recordA.id == recordB.id;

export const recordIsInBatch = (record: Record, batch: Record[]) => {
  const match = batch.find((batchRecord: Record) => recordsEqual(batchRecord, record));
  return !!match;
};
