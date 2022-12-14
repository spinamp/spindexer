import { Table } from '../../db/db'
import { Processor, Clients } from '../../types/processor'
import { ProcessedTrack } from '../../types/track';
import { Trigger } from '../../types/trigger'

type TrackMediaField = 'lossyArtwork' | 'lossyAudio';

const uploadedTracksWithoutUrls: (field: TrackMediaField) => Trigger<undefined> =
 (field) => async (clients) => {
   const tracksWithCIDWithoutURL = await clients.db.rawSQL(`
    select "id", "${field}IPFSHash", "${field}URL" from "${Table.processedTracks}"
    where
      "${field}IPFSHash" is not null and
      "${field}URL" is null
  `)

   return tracksWithCIDWithoutURL.rows;
 }

export const processedTrackUrlSync: (field: TrackMediaField) => Processor =
(field) => {
  return {
    name: 'processedTrackUrlSync',
    trigger: uploadedTracksWithoutUrls(field),
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
