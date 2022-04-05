export type Record = {
  id: string
}

export type PartialRecord<Type> = Partial<Type> & Record

export type ValueIsWhere = {
  key: string,
  value: {},
}

export type ValueExistsWhere = {
  key: string,
  valueExists: boolean
}

export type Where = ValueIsWhere | ValueExistsWhere

export type Query = {
  where: Where[] | Where,
  whereType?: string
}
export type DBClient = {
  getCursor: (processor: string) => Promise<number | undefined>;
  getRecord: (tableName: string, id: string) => Promise<Record>;
  getRecords: (tableName: string, query?: Query) => Promise<Record[]>;
  insert: (tableName: string, rows: Record[]) => Promise<void>;
  update: (tableName: string, rows: Record[]) => Promise<void>;
  delete: (tableName: string, ids: string[]) => Promise<void>;
  updateProcessor: (processor: string, newProcessedDBBlock: Number) => Promise<void>;
  getNumberRecords: (tableName: string) => Promise<any>;
  recordExists: (tableName: string, recordID: string) => Promise<boolean>;
  getFullDB: () => Promise<any>;
}
