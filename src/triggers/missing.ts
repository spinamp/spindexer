import { Table } from '../db/db';
import { Trigger } from '../types/trigger';

export const missingCreatedAtTime: (tableName: Table) => Trigger<undefined> = (tableName: Table) => async (clients) => {
  const nfts = (await clients.db.getRecords(tableName,
    [
      ['whereNull', ['createdAtTime']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingMetadataObject: Trigger<undefined> = async (clients) => {
  const nfts = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['metadata']],
      ['and'],
      ['whereNull', ['metadataError']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingMetadataIPFSHash: Trigger<undefined> = async (clients) => {
  const nfts = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['whereNull', ['metadataIPFSHash']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingProcessedArtworks: Trigger<undefined> = async (clients) => {
  const query = `select t.* from  "${Table.processedTracks}" as t
  left join "${Table.processedArtworks}" as a on t.id = a."trackId"
  where a.id is null
  limit ${process.env.QUERY_TRIGGER_BATCH_SIZE!}`
  return (await clients.db.rawSQL(
    query
  )).rows
};

export const erc721NFTsWithoutTracks: (platformId: string, limit?: number) => Trigger<undefined> =
  (platformId: string, limit: number = parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)) => async (clients) => {
    // This query joins nfts+tracks through the join table,
    // and returns nfts where there is no corresponding track.
    // It also filters out error tracks so that nfts where we fail
    // to create a track are not repeated.
    const nftQuery = `select n.* from "${Table.erc721nfts}" as n
      LEFT OUTER JOIN "${Table.erc721nfts_processedTracks}" as j
      ON n.id = j."erc721nftId"
      LEFT OUTER JOIN "${Table.processedTracks}" as p
      ON j."processedTrackId" = p.id
      LEFT OUTER JOIN "${Table.erc721nftProcessErrors}" as e
      ON n.id = e."erc721nftId"
      WHERE p.id is NULL AND
      e."processError" is NULL AND
      n."metadataError" is NULL AND
      n."platformId"='${platformId}'
      ORDER BY n."createdAtTime"
      LIMIT ${limit}`
    const nfts = (await clients.db.rawSQL(
      nftQuery
    )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
    return nfts;
  };

export const unprocessedNFTs: Trigger<undefined> = async (clients) => {
  const nfts = (await clients.db.rawSQL(
    `select * from ${Table.erc721nfts} where "tokenURI" is null;`
  )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};
