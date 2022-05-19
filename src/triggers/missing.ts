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
  const nfts = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['metadata']],
      ['and'],
      ['whereNull', ['metadataError']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingMetadataIPFSHash: Trigger<undefined> = async (clients: Clients) => {
  const nfts = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['metadataIPFSHash']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const erc721NFTsWithoutTracks: (platformId: string, limit?: number) => Trigger<undefined> =
  (platformId: string, limit: number = parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)) => async (clients: Clients) => {
    // This query joins nfts+tracks through the join table,
    // and returns nfts where there is no corresponding track.
    // It also filters out error tracks so that nfts where we fail
    // to create a track are not repeated.
    const query = `select n.* from "${Table.erc721nfts}" as n
      LEFT OUTER JOIN "${Table.erc721nfts_processedTracks}" as j
      ON n.id = j."erc721nftId"
      LEFT OUTER JOIN "${Table.processedTracks}" as p
      ON j."processedTrackId" = p.id
      LEFT OUTER JOIN "${Table.erc721nftProcessErrors}" as e
      ON n.id = e."erc721nftId"
      WHERE p.id is NULL AND
      e."processError" is NULL AND
      n."platformId"='${platformId}'
      ORDER BY n."createdAtTime"
      LIMIT ${limit}`
      const nfts = (await clients.db.rawSQL(
        query
      )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
    return nfts;
  };

export const unprocessedNFTs: Trigger<undefined> = async (clients: Clients) => {
  const nfts = (await clients.db.rawSQL(
    `select * from ${Table.erc721nfts} where "tokenURI" is null;`
  )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};
