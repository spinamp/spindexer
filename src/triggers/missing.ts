import { Table } from '../db/db';
import { Trigger } from '../types/trigger';

export const missingCreatedAtTime: (tableName: Table) => Trigger<undefined> = (tableName: Table) => async (clients) => {
  const nfts = (await clients.db.getRecords(tableName,
    [
      ['whereNull', ['createdAtTime']],
      ['whereNotNull', ['createdAtEthereumBlockNumber']]
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingMetadataObject: Trigger<undefined> = async (clients) => {
  const nftQuery = `select * from ${Table.erc721nfts} n
    left outer join "${Table.erc721nftProcessErrors}" enpe
    on n.id = enpe."erc721nftId"
    where enpe."metadataError" is null
    and n.metadata is null  
  `
  const nfts = (await clients.db.rawSQL(nftQuery))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingMetadataIPFSHash: Trigger<undefined> = async (clients) => {
  const nftQuery = `select * from ${Table.erc721nfts} n
  left outer join "${Table.erc721nftProcessErrors}" enpe 
  on n.id = enpe."erc721nftId" 
  where enpe."metadataError" is null
  and n."metadataIPFSHash" is null`;
  const nfts = (await clients.db.rawSQL(nftQuery))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
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
      e."metadataError" is NULL AND
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
