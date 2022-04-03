import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

const BATCH_SIZE = 300;

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
    })).slice(0, BATCH_SIZE);
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
    })).slice(0, BATCH_SIZE);;
  return tracks;
};
