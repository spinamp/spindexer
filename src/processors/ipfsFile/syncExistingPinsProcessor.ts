import { Table } from '../../db/db'
import { IPFSFile } from '../../types/ipfsFile'
import { Processor, Clients } from '../../types/processor'
import { Trigger } from '../../types/trigger'

const ipfsFilesOutOfSyncWithPins: Trigger<undefined> = async (clients) => {
  const tracksWithCIDsMatchingURL = await clients.db.rawSQL(`
    select distinct "lossyArtworkIPFSHash", "lossyArtworkURL" from "${Table.processedTracks}" as t
    left outer join "${Table.ipfsFiles}" as file
    on t."lossyArtworkIPFSHash" = file.cid
    where
      t."lossyArtworkIPFSHash" is not null and
      file.cid is null and
      file.error is null and
      t."lossyArtworkURL" ILIKE ('%' || t."lossyArtworkIPFSHash" || '%')
  `)

  return tracksWithCIDsMatchingURL.rows;
}

export const ipfsFileSyncExistingPinsProcessor: Processor =
  {
    name: 'ipfsFileSyncExistingPinsProcessor',
    trigger: ipfsFilesOutOfSyncWithPins,
    processorFunction: async (input: IPFSFile[], clients: Clients) => {
      console.log('Adding ipfs files for media pinned by other platforms');

      const files = input.map((row: any) => ({
        url: row.lossyArtworkURL,
        cid: row.lossyArtworkIPFSHash,
      }))
      await clients.db.insert(Table.ipfsFiles, files)
    }
  }
