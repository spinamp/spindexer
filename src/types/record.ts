export type EthereumTimestamp = {
  createdAtBlockNumber: string;
}

export type APITimestamp = {
  createdAtTime: string;
}

export type Timestamp = EthereumTimestamp | APITimestamp;

export type Record = {
  id: string
} & Timestamp

export enum RecordType {
  nft = "nft",
  track = "track"
}

export const recordsEqual = (recordA: Record, recordB: Record) => recordA.id == recordB.id;

export const recordIsInBatch = (record: Record, batch: Record[]) => {
  const match = batch.find((batchRecord: Record) => recordsEqual(batchRecord, record));
  return !!match;
};
