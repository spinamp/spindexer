import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const missingTrackMetadata: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    {
      where: [
        {
          key: 'metadata',
          value: undefined
        }, {
          key: 'metadataError',
          value: undefined
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
        value: undefined
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
        value: undefined
      }
    })).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
