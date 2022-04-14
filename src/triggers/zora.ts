import { MusicPlatform } from '../types/platform';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const zoraRawWithMetadata: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    [
      ['where', [{ platform: MusicPlatform.zora }]],
      ['and'],
      ['whereNotNull', ['metadata']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
