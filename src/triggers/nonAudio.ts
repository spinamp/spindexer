import { Table } from '../db/db';
import { SourceIPFS } from '../types/track';
import { Trigger } from '../types/trigger';

export const nonAudioMetadata: Trigger<undefined> = async (clients) => {
  const nfts = (await clients.db.getRecords(Table.nfts,
    [
      [
        'whereIn', ['mimeType',
          [
            '',
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
  return nfts;
};

export const missingMimeType: (source: SourceIPFS) => Trigger<undefined> = (source) =>
{
  return async (clients) => {
    const processedTracksQuery = `
        select *
        from "${Table.processedTracks}"
        where "lossy${source}MimeType" is null
        and "lossy${source}IPFSHash" is not null
        limit ${process.env.QUERY_TRIGGER_BATCH_SIZE}
    `;

    const processedTracks = (await clients.db.rawSQL(processedTracksQuery)).rows;
    return processedTracks;
  }
}
