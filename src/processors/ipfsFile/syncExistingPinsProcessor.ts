import { Table } from '../../db/db'
import { IPFSFile, IPFSFileUrl } from '../../types/ipfsFile'
import { Processor, Clients } from '../../types/processor'
import { ProcessedTrack } from '../../types/track';
import { Trigger } from '../../types/trigger'

type TrackMediaField = 'lossyArtwork' | 'lossyAudio';

const ipfsFilesOutOfSyncWithPins: (field: TrackMediaField) => Trigger<undefined> =
 (field) => async (clients) => {
   const tracksWithCIDsMatchingURL = await clients.db.rawSQL(`
    select distinct "${field}IPFSHash", "${field}URL" from "${Table.processedTracks}" as t
    left outer join "${Table.ipfsFiles}" as file
    on t."${field}IPFSHash" = file.cid
    where (
      t."${field}IPFSHash" is not null and
      file.cid is null and
      file.error is null and
      t."${field}URL" ILIKE ('%' || t."${field}IPFSHash" || '%')
    ) or (
      t."${field}IPFSHash" is not null and
      t."${field}URL" is not null and
      file.cid is null and
      file.error is null
    )
  `)

   return tracksWithCIDsMatchingURL.rows;
 }

const ipfsFilesPinnedWithoutUrl: (field: TrackMediaField) => Trigger<undefined> =
 (field) => async (clients) => {
   const tracksWithCIDWithoutURL = await clients.db.rawSQL(`
    select "id", "${field}IPFSHash", "${field}URL" from "${Table.processedTracks}" as t
    left outer join "${Table.ipfsFilesUrls}" as url
    on t."${field}URL" = url.url
    where
      t."${field}IPFSHash" is not null and
      t."${field}URL" is null and
      url.cid is null and
      url.error is null
  `)

   return tracksWithCIDWithoutURL.rows;
 }

export const ipfsFileSyncExistingPinsProcessor: (field: TrackMediaField) => Processor =
(field) => {
  return {
    name: 'ipfsFileSyncExistingPinsProcessor',
    trigger: ipfsFilesOutOfSyncWithPins(field),
    processorFunction: async (input: any[], clients: Clients) => {
      console.log(`Adding ${field} ipfs files for media pinned by other platforms`);

      const files: IPFSFile[] = input.map((row: any) => ({ cid: row[`${field}IPFSHash`] }))
      await clients.db.insert(Table.ipfsFiles, files);

      const filesUrls: IPFSFileUrl[] = input.map((row: any) => ({
        url: row[`${field}URL`],
        cid: row[`${field}IPFSHash`],
      }))
      await clients.db.insert(Table.ipfsFilesUrls, filesUrls);
    }
  }
}

export const ipfsFileSyncExternalPinsProcessor: (field: TrackMediaField) => Processor =
(field) => {
  return {
    name: 'ipfsFileSyncExternalPinsProcessor',
    trigger: ipfsFilesPinnedWithoutUrl(field),
    processorFunction: async (input: any[], clients: Clients) => {
      console.log(`Adding ${field} ipfs files for media pinned without URLS`);

      const tracks: Partial<ProcessedTrack>[] = input.map((row: any) => ({
        id: row.id,
        [`${field}URL`]: `${process.env.IPFS_ENDPOINT}${row[`${field}IPFSHash`]}`,
      }))
      await clients.db.update(Table.processedTracks, tracks);

      const files: IPFSFile[] = input.map((row: any) => ({ cid: row[`${field}IPFSHash`] }))
      await clients.db.upsert(Table.ipfsFiles, files, 'cid');

      const filesUrls: IPFSFileUrl[] = input.map((row: any) => ({
        url: `${process.env.IPFS_ENDPOINT}${row[`${field}IPFSHash`]}`,
        cid: row[`${field}IPFSHash`],
      }))
      await clients.db.upsert(Table.ipfsFilesUrls, filesUrls, 'url');
    }
  }
}
