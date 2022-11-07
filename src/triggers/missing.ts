import { Table } from '../db/db';
import { ChainId } from '../types/chain';
import { Trigger } from '../types/trigger';

export const ethereumMissingCreatedAtTime: (chainId: ChainId, tableName: Table) => Trigger<undefined> = 
(chainId: ChainId, tableName: Table) => async (clients) => {
  const nfts = (await clients.db.getRecords(tableName,
    [
      ['whereNull', ['createdAtTime']],
      ['whereNotNull', ['createdAtEthereumBlockNumber']],
      ['andWhere', ['chainId', chainId]],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};

export const missingMetadataObject: Trigger<undefined> = async (clients) => {
  const nftQuery = `select * from "${Table.nfts}" n
    left outer join "${Table.nftProcessErrors}" enpe
    on n.id = enpe."nftId"
    where enpe."metadataError" is null
    and n.metadata is null
    and n."tokenURI" is not null
    and n."tokenURI" != ''
    and n.approved = true
    limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
  `
  const nfts = (await clients.db.rawSQL(nftQuery)).rows
  return nfts;
};

export const missingMetadataIPFSHash: Trigger<undefined> = async (clients) => {
  const nftQuery = `select * from "${Table.nfts}" n
  left outer join "${Table.nftProcessErrors}" enpe
  on n.id = enpe."nftId"
  where enpe."metadataError" is null
  and n."metadataIPFSHash" is null
  and n.approved = true
  limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
  `;
  const nfts = (await clients.db.rawSQL(nftQuery)).rows
  return nfts;
};

export const NFTsWithoutTracks: (platformId: string, limit?: number) => Trigger<undefined> =
  (platformId: string, limit: number = parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)) => async (clients) => {
    // This query joins nfts+tracks through the join table,
    // and returns nfts where there is no corresponding track.
    // It also filters out error tracks so that nfts where we fail
    // to create a track are not repeated.
    // Additionally we only return results for nfts that have
    // been marked as approved.
    const nftQuery = `select n.* from "${Table.nfts}" as n
      LEFT OUTER JOIN "${Table.nfts_processedTracks}" as j
      ON n.id = j."nftId"
      LEFT OUTER JOIN "${Table.processedTracks}" as p
      ON j."processedTrackId" = p.id
      LEFT OUTER JOIN "${Table.nftProcessErrors}" as e
      ON n.id = e."nftId"
      WHERE p.id is NULL AND
      e."processError" is NULL AND
      e."metadataError" is NULL AND
      n."platformId"='${platformId}' AND
      n.metadata is not null AND
      n.approved = true
      and n."createdAtTime" is NOT NULL
      and (n."publicReleaseTime" is NULL OR n."publicReleaseTime"::timestamp < now())
      ORDER BY n."createdAtTime"
      LIMIT ${limit}`

    const nfts = (await clients.db.rawSQL(
      nftQuery
    )).rows
    return nfts;
  };

export const unprocessedNFTs: Trigger<undefined> = async (clients) => {
  const nfts = (await clients.db.rawSQL(
    `select * from "${Table.nfts}"
     where "tokenURI" is null
     and approved = true
     limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
    `
  )).rows
  return nfts;
};
