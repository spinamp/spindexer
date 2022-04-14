import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const nonAudioTracks: Trigger<Clients, undefined> = async (clients: Clients) => {
  const tracks = (await clients.db.getRecords('tracks',
    [
      [
        'whereIn', ['mimeType',
          [
            'text/plain',
            'image/png',
            'image/jpeg',
            'image/gif',
            'text/html',
            'text/markdown',
            'application/pdf',
            'application/json',
            'image/tiff',
            'image/*',
            'image/vnd.adobe.photoshop',
            'present/form',
            'souls/hid',
            'application/postscript',
            'video/mp4',
            'video/quicktime',
          ]
        ]
      ]]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return tracks;
};
