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
      ['whereNull', ['platform']]
    ])).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};

export const unprocessedPlatformTracks: (platform: MusicPlatform) => Trigger<Clients, undefined> = (platform: MusicPlatform) => async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    [
      ['whereNull', ['processed']],
      ['andWhere', [{ platform }]],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
