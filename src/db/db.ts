import { Knex } from 'knex';

import { Cursor } from '../types/trigger'

export enum Table {
  platforms = 'raw_platforms',
  nfts = 'raw_nfts',
  erc721Transfers = 'raw_erc721_transfers',
  artists = 'raw_artists',
  artistProfiles = 'raw_artist_profiles',
  processedTracks = 'raw_processed_tracks',
  processors = 'raw_processors',
  metaFactories = 'raw_meta_factories',
  nftFactories = 'raw_nft_factories',
  nfts_processedTracks = 'raw_nfts_processed_tracks',
  nftProcessErrors = 'raw_nft_process_errors',
  ipfsPins = 'raw_ipfs_pins',
  ipfsFiles = 'raw_ipfs_files'
}

export type WhereFunc = 'where'
| 'whereNull'
| 'andWhere'
| 'whereJsonPath'
| 'whereNotNull'
| 'whereIn'
| 'whereNotIn';

export type WhereField = 'and';

export type WhereFuncParam = any;

export type FieldWhere = [WhereField]
export type FuncWhere = [WhereFunc, WhereFuncParam[]]
export type Where = FieldWhere | FuncWhere;

export type Wheres = Where[];

export type QueryOptions = {
  ignoreConflict?: string;
}

export type DBClient = {
  getDB: () => Knex;
  getCursor: (processor: string) => Promise<string | undefined>;
  getRecords: <Type>(tableName: Table, wheres?: Wheres) => Promise<Type[]>;
  insert: <Type>(tableName: Table, rows: Type[], options?: QueryOptions) => Promise<void>;
  update: <Type>(tableName: Table, rows: Type[]) => Promise<void>;
  upsert: <Type>(tableName: Table, rows: Type[], idField?: string | string[], mergeOptions?: undefined | string[]) => Promise<void>;
  delete: (tableName: Table, ids: string[], idField?: string) => Promise<void>;
  updateProcessor: (processor: string, lastCursor: Cursor) => Promise<void>;
  getNumberRecords: (tableName: Table) => Promise<any>;
  rawSQL: (raw: string) => Promise<any>;
  rawBoundSQL: (raw: string, binding: any[]) => Promise<Knex.Raw<any>>;
  recordExists: (tableName: Table, recordID: string) => Promise<boolean>;
  recordsExist: (tableName: Table, recordIDs: string[]) => Promise<string[]>;
  getFullDB?: () => Promise<any>;
  close: () => Promise<void>;
}
