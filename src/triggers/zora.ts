import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const zoraNotCatalog: Trigger<Clients, undefined> = async (clients: Clients) => {
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
