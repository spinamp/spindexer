import { Table } from '../../db/db'
import { IPFSFile, IPFSFileUrl } from '../../types/ipfsFile'
import { Processor, Clients } from '../../types/processor'
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

export const ipfsFileSyncExistingUploadsProcessor: (field: TrackMediaField) => Processor =
(field) => {
  return {
    name: 'ipfsFileSyncExistingUploadsProcessor',
    trigger: ipfsFilesOutOfSyncWithUploads(field),
    processorFunction: async (input: any[], clients: Clients) => {
      console.log(`Adding ${field} ipfsFiles and ipfsFileUrls for media already on IPFS`);

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
