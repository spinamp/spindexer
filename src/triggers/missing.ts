import { Table } from '../db/db';
import { MusicPlatform } from '../types/platform';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const missingCreatedAtTime: Trigger<undefined> = async (clients: Clients) => {
  const nfts = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['createdAtTime']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingMetadataObject: Trigger<undefined> = async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['metadata']],
      ['and'],
      ['whereNull', ['metadataError']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

export const missingMetadataIPFSHash: Trigger<undefined> = async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['metadataIPFSHash']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

export const missingMetadataPlatform: Trigger<undefined> = async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['platformId']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

export const unprocessedPlatformMetadatas: (platformId: MusicPlatform, limit?: number) => Trigger<undefined> = (platformId: MusicPlatform, limit?: number) => async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['processed']],
      ['andWhere', [{ platformId }]],
    ]
  )).slice(0, limit || parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

export const unprocessedNFTs: Trigger<undefined> = async (clients: Clients) => {
  const nfts = (await clients.db.rawSQL(
    `select * from ${Table.erc721nfts} where "tokenURI" is null;`
  )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};
