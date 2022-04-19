import { MusicPlatform } from '../types/platform';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const missingTrackMetadata: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    [
      ['whereNull', ['metadata']],
      ['and'],
      ['whereNull', ['metadataError']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};

export const missingMetadataIPFSHash: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    [
      ['whereNull', ['metadataIPFSHash']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};

export const missingPlatform: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    [
      ['whereNull', ['platformId']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};

export const unprocessedPlatformTracks: (platformId: MusicPlatform, limit?: number) => Trigger<Clients, undefined> = (platformId: MusicPlatform, limit?: number) => async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    [
      ['whereNull', ['processed']],
      ['andWhere', [{ platformId }]],
    ]
  )).slice(0, limit || parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
