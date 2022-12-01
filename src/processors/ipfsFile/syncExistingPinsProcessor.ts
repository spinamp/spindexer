import { Table } from '../../db/db'
import { IPFSFile } from '../../types/ipfsFile'
import { Processor, Clients } from '../../types/processor'
import { Trigger } from '../../types/trigger'

const ipfsFilesOutOfSyncWithPins: Trigger<undefined> = async (clients) => {
  const tracksWithCIDsMatchingURL = await clients.db.rawSQL(`
  select distinct "lossyArtworkIPFSHash" from "${Table.processedTracks}" as t
  left outer join "${Table.ipfsFiles}" as i
  on t."lossyArtworkIPFSHash" = i.cid
  where
    t."lossyArtworkIPFSHash" is not null and
    i.cid is null and
    i.error is null and
    t."lossyArtworkURL" ILIKE ('%' || t."lossyArtworkIPFSHash" || '%')
  `)

  return tracksWithCIDsMatchingURL.rows.map((row: any) => ({
    url: row.lossyArtworkURL,
    cid: row.lossyArtworkIPFSHash,
  }))
}

export const ipfsFileSyncExistingPinsProcessor: Processor =
  {
    name: 'ipfsFileSyncExistingPinsProcessor',
    trigger: ipfsFilesOutOfSyncWithPins,
    processorFunction: async (input: IPFSFile[], clients: Clients) => {
      console.log('Adding ipfs files for media pinned by other platforms');

      await clients.db.update(Table.ipfsFiles, input, 'url')
    }
  }
