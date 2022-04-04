import { MusicPlatform } from '../types/platforms';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const zoraRaw: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    {
      where: [
        {
          key: 'platform',
          value: MusicPlatform.zora
        }]
    })).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
