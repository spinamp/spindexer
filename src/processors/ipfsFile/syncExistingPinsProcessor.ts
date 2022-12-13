import { Table } from '../../db/db'
import { IPFSFile, IPFSFileUrl } from '../../types/ipfsFile'
import { Processor, Clients } from '../../types/processor'
import { Trigger } from '../../types/trigger'

type TrackMediaField = 'lossyArtwork' | 'lossyAudio';

const ipfsFilesOutOfSyncWithPins: (field: TrackMediaField) => Trigger<undefined> =
 (field) => async (clients) => {
   const tracksWithCIDsMatchingURL = await clients.db.rawSQL(`
    select distinct "${field}IPFSHash", "${field}URL" from "${Table.processedTracks}" as t
    left outer join "${Table.ipfsFiles}" as file
    on t."${field}IPFSHash" = file.cid
    where
      t."${field}IPFSHash" is not null and
      file.cid is null and
      file.error is null and
      t."${field}URL" ILIKE ('%' || t."${field}IPFSHash" || '%')
  `)

   return tracksWithCIDsMatchingURL.rows;
 }

export const ipfsFileSyncExistingPinsProcessor: (field: TrackMediaField) => Processor =
(field) => {
  return {
    name: 'ipfsFileSyncExistingPinsProcessor',
    trigger: ipfsFilesOutOfSyncWithPins(field),
    processorFunction: async (input: IPFSFile[], clients: Clients) => {
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
