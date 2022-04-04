import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const nonAudioTracks: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    {
      where: [
        {
          key: 'metadata.mimeType',
          value: 'text/plain'
        },
        {
          key: 'metadata.mimeType',
          value: 'image/png'
        },
        {
          key: 'metadata.mimeType',
          value: 'image/jpeg'
        },
        {
          key: 'metadata.mimeType',
          value: 'image/gif'
        },
        {
          key: 'metadata.mimeType',
          value: 'text/html'
        },
        {
          key: 'metadata.mimeType',
          value: 'text/markdown'
        },
        {
          key: 'metadata.mimeType',
          value: 'application/pdf'
        },
        {
          key: 'metadata.mimeType',
          value: 'application/json'
        },
        {
          key: 'metadata.mimeType',
          value: 'image/tiff'
        },
        {
          key: 'metadata.mimeType',
          value: 'image/*'
        },
        {
          key: 'metadata.mimeType',
          value: 'image/vnd.adobe.photoshop'
        },
        {
          key: 'metadata.mimeType',
          value: 'present/form'
        },
        {
          key: 'metadata.mimeType',
          value: 'souls/hid'
        },
        {
          key: 'metadata.mimeType',
          value: 'application/postscript'
        },
        {
          key: 'metadata.mimeType',
          value: 'video/mp4'
        }, {
          key: 'metadata.mimeType',
          value: 'video/quicktime'
        }
      ],
      whereType: 'or',
    })).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
