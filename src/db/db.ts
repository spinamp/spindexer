import { Record, RecordUpdate } from '../types/record'
import { Cursor } from '../types/trigger'

export enum Table {
  platforms = 'platforms',
  erc721nfts = 'erc721nfts',
  artists = 'artists',
  artistProfiles = 'artistProfiles',
  processedTracks = 'processedTracks',
  processors = 'processors',
  factoryContracts = 'factoryContracts',
  erc721Contracts = 'erc721Contracts',
  erc721nfts_processedTracks = 'erc721nfts_processedTracks',
  erc721nftProcessErrors = 'erc721nftProcessErrors'
}

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
  getRecords: <Type>(tableName: Table, wheres?: Wheres) => Promise<Type[]>;
  insert: <Type>(tableName: Table, rows: Type[]) => Promise<void>;
  update: <Type>(tableName: Table, rows: Type[]) => Promise<void>;
  upsert: (tableName: Table, rows: (Record | RecordUpdate<unknown>)[], idField?: string | string[]) => Promise<void>;
  delete: (tableName: Table, ids: string[], idField?: string) => Promise<void>;
  updateProcessor: (processor: string, lastCursor: Cursor) => Promise<void>;
  getNumberRecords: (tableName: Table) => Promise<any>;
  rawSQL: (raw: string) => Promise<any>;
  recordExists: (tableName: Table, recordID: string) => Promise<boolean>;
  recordsExist: (tableName: Table, recordIDs: string[]) => Promise<string[]>;
  getFullDB?: () => Promise<any>;
  close: () => Promise<void>;
}
