import { MusicPlatform } from '../types/platform';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const zoraMetadatas: Trigger<Clients, undefined> = async (clients: Clients) => {
  const metadatas = (await clients.db.getRecords('metadatas',
    [
      ['where', [{ platformId: MusicPlatform.zora }]],
      ['and'],
      ['whereNotNull', ['metadata']],
      ['and'],
      ['whereNotNull', ['metadataError']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return metadatas;
};
