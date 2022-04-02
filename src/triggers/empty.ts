import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const missingTrackMetadata: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = await clients.db.getRecords('tracks',
    {
      where:
      {
        key: 'metadata',
        value: undefined
      }
    });
  return tracks;
};
