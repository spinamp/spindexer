import { Cursor } from "../types/trigger"

export type Record = {
  id: string
}

export type PartialRecord<Type> = Partial<Type> & Record

export type WhereFunc = 'where'
  | 'whereNull'
  | 'andWhere'
  | 'whereJsonPath'
  | 'whereNotNull'
  | 'whereIn';

export type WhereField = 'and';

export type WhereFuncParam = any;

export type FieldWhere = [WhereField]
export type FuncWhere = [WhereFunc, WhereFuncParam[]]
export type Where = FieldWhere | FuncWhere;

export type Wheres = Where[];

export type DBClient = {
  getCursor: (processor: string) => Promise<string | undefined>;
  getRecords: <Type extends Record>(tableName: string, wheres?: Wheres) => Promise<Type[]>;
  insert: (tableName: string, rows: Record[]) => Promise<void>;
  update: (tableName: string, rows: Record[]) => Promise<void>;
  upsert: (tableName: string, rows: Record[]) => Promise<void>;
  delete: (tableName: string, ids: string[]) => Promise<void>;
  updateProcessor: (processor: string, lastCursor: Cursor) => Promise<void>;
  getNumberRecords: (tableName: string) => Promise<any>;
  recordExists: (tableName: string, recordID: string) => Promise<boolean>;
  getFullDB: () => Promise<any>;
  close: () => Promise<void>;
}
