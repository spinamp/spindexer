import { MusicPlatform } from '../types/platform';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const missingTrackMetadata: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    {
      where: [
        {
          key: 'metadata',
          valueExists: false
        }, {
          key: 'metadataError',
          valueExists: false
        }]
    })).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};

export const missingMetadataIPFSHash: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    {
      where:
      {
        key: 'metadataIPFSHash',
        valueExists: false
      }
    })).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};

export const missingPlatform: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    {
      where:
      {
        key: 'platform',
        valueExists: false
      }
    })).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};

export const unprocessedPlatformTracks = (platform: MusicPlatform) => async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    {
      where:
        [{
          key: 'processed',
          valueExists: false
        },
        {
          key: 'platform',
          value: platform
        }]
    })).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
