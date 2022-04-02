import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const tokenURIEmpty: Trigger<Clients, undefined> = async (clients: Clients) => {
  const emptyTokenURIs = await clients.db.getRecords('tracks',
    {
      where:
      {
        key: 'tokenMetadataURI',
        value: undefined
      }
    });
  return emptyTokenURIs;
};

export const trackMetadataEmpty: Trigger<Clients, undefined> = async (clients: Clients) => {
  const emptyTracks = await clients.db.getRecords('tracks',
    {
      where:
      {
        key: 'metadata',
        value: undefined
      }
    });
  return emptyTracks;
};
