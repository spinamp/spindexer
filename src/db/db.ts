export type Record = {
  id: string
}

export type DBClient = {
  getLastProcessedBlock: (processor: string) => Promise<number>;
  insert: (tableName: string, rows: Record[]) => Promise<void>;
  updateProcessor: (processor: string, newProcessedDBBlock: Number) => Promise<void>;
  getNumberRecords: (tableName: string) => any;
  recordExists: (tableName: string, recordID: string) => Promise<boolean>;
}
