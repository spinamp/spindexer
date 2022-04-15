export type EthereumBlockNumberField = {
  createdAtEthereumBlockNumber?: string;
}

export type DateTimeField = {
  createdAtTime: Date;
}

export type TimeField = EthereumBlockNumberField & DateTimeField;

export type Record = {
  id: string
} & TimeField

export enum RecordType {
  nft = "nft",
  track = "track"
}

export const recordsEqual = (recordA: Record, recordB: Record) => recordA.id == recordB.id;

export const recordIsInBatch = (record: Record, batch: Record[]) => {
  const match = batch.find((batchRecord: Record) => recordsEqual(batchRecord, record));
  return !!match;
};
