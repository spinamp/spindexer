import { MusicPlatform } from '../types/platform';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const missingMetadataObject: Trigger<Clients, undefined> = async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords('metadatas',
    [
      ['whereNull', ['metadata']],
      ['and'],
      ['whereNull', ['metadataError']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

export const missingMetadataIPFSHash: Trigger<Clients, undefined> = async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords('metadatas',
    [
      ['whereNull', ['metadataIPFSHash']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

export const missingMetadataPlatform: Trigger<Clients, undefined> = async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords('metadatas',
    [
      ['whereNull', ['platformId']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

export const unprocessedPlatformMetadatas: (platformId: MusicPlatform, limit?: number) => Trigger<Clients, undefined> = (platformId: MusicPlatform, limit?: number) => async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords('metadatas',
    [
      ['whereNull', ['processed']],
      ['andWhere', [{ platformId }]],
    ]
  )).slice(0, limit || parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};

// This triggers gets all nfts which have not yet had their metadata record created.
// We query for all NFTs which do not have a corresponding record in the metadata table
// matching their metadataId
export const unprocessedNFTs: Trigger<Clients, undefined> = async (clients: Clients) => {
  const nfts = (await clients.db.rawSQL(
    `select * from erc721nfts where "tokenURI" is null;`
  )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  console.log({ nfts })
  return nfts;
};
