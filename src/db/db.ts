export type Record = {
  id: string
}

export type DBClient = {
  getLastProcessedBlock: () => Promise<number>;
  update: (tableName: string, rows: Record[], newProcessedDBBlock: Number) => Promise<void>;
  getNumberRecords: (tableName: string) => any;
  recordExists: (tableName: string, recordID: string) => Promise<boolean>;
}
