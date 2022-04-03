export type Record = {
  id: string
}

export type Query = {
  where: {
    key: string,
    value: any
  }[] | {
    key: string,
    value: any
  }
}
export type DBClient = {
  getCursor: (processor: string) => Promise<number | undefined>;
  getRecords: (tableName: string, query?: Query) => Promise<Record[]>;
  insert: (tableName: string, rows: Record[]) => Promise<void>;
  update: (tableName: string, rows: Record[]) => Promise<void>;
  delete: (tableName: string, ids: string[]) => Promise<void>;
  updateProcessor: (processor: string, newProcessedDBBlock: Number) => Promise<void>;
  getNumberRecords: (tableName: string) => Promise<any>;
  recordExists: (tableName: string, recordID: string) => Promise<boolean>;
  getFullDB: () => Promise<any>;
}
