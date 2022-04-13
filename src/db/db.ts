import { Cursor } from "../types/trigger"

export type Record = {
  id: string
}

export type PartialRecord<Type> = Partial<Type> & Record

export type ValueIsWhere = {
  key: string,
  value: {},
}

export type ValueInWhere = {
  key: string,
  valueIn: string[],
}

export type ValueExistsWhere = {
  key: string,
  valueExists: boolean
}

export type Where = ValueIsWhere | ValueExistsWhere | ValueInWhere

export type Query = {
  where: Where[] | Where,
  whereType?: string
}

export type DBClient = {
  getCursor: (processor: string) => Promise<string | undefined>;
  getRecord: (tableName: string, id: string) => Promise<Record>;
  getRecords: <Type extends Record>(tableName: string, query?: Query) => Promise<Type[]>;
  insert: (tableName: string, rows: Record[]) => Promise<void>;
  update: (tableName: string, rows: Record[]) => Promise<void>;
  upsert: (tableName: string, rows: Record[]) => Promise<void>;
  delete: (tableName: string, ids: string[]) => Promise<void>;
  updateProcessor: (processor: string, lastCursor: Cursor) => Promise<void>;
  getNumberRecords: (tableName: string) => Promise<any>;
  recordExists: (tableName: string, recordID: string) => Promise<boolean>;
  getFullDB: () => Promise<any>;
}
