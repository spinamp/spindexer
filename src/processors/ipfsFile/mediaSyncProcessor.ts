import { Table } from '../../db/db'
import { IPFSFile, IPFSFileUrl } from '../../types/ipfsFile'
import { Processor, Clients } from '../../types/processor'
import { ProcessedTrack } from '../../types/track';
import { Trigger } from '../../types/trigger'

type TrackMediaField = 'lossyArtwork' | 'lossyAudio';

const ipfsFilesOutOfSyncWithUploads: (field: TrackMediaField) => Trigger<undefined> =
 (field) => async (clients) => {
   const tracksWithCIDsMatchingURL = await clients.db.rawSQL(`
    select distinct "${field}IPFSHash", "${field}URL" from "${Table.processedTracks}" as t
    left outer join "${Table.ipfsFiles}" as file
    on t."${field}IPFSHash" = file.cid
    where (
      t."${field}IPFSHash" is not null and
      t."${field}URL" is not null and
      file.cid is null and
      file.error is null
    )
  `)

   return tracksWithCIDsMatchingURL.rows;
 }

const ipfsFilesUploadedWithoutUrl: (field: TrackMediaField) => Trigger<undefined> =
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

export const ipfsFileSyncExistingUploadsProcessor: (field: TrackMediaField) => Processor =
(field) => {
  return {
    name: 'ipfsFileSyncExistingUploadsProcessor',
    trigger: ipfsFilesOutOfSyncWithUploads(field),
    processorFunction: async (input: any[], clients: Clients) => {
      console.log(`Adding ${field} ipfs files for media uploaded by other platforms`);

      const files: IPFSFile[] = input.map((row: any) => ({ cid: row[`${field}IPFSHash`] }))
      const filesUrls: IPFSFileUrl[] = input.map((row: any) => ({
        url: row[`${field}URL`],
        cid: row[`${field}IPFSHash`],
      }))

      await clients.db.insert(Table.ipfsFiles, files);
      await clients.db.insert(Table.ipfsFilesUrls, filesUrls);
    }
  }
}

export const ipfsHashAndUrlSync: (field: TrackMediaField) => Processor =
(field) => {
  return {
    name: 'ipfsHashAndUrlSync',
    trigger: ipfsFilesUploadedWithoutUrl(field),
    processorFunction: async (input: any[], clients: Clients) => {
      console.log(`Adding missing ${field}Urls for tracks which already have an ${field}IPFSHash`);

      const tracks: Partial<ProcessedTrack>[] = input.map((row: any) => ({
        id: row.id,
        [`${field}URL`]: `${process.env.IPFS_ENDPOINT}${row[`${field}IPFSHash`]}`,
      }))

      await clients.db.update(Table.processedTracks, tracks);
    }
  }
}
