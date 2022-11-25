import { Table } from '../../db/db';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { Trigger } from '../../types/trigger';
import { rollPromises } from '../../utils/rollingPromises';

export enum SourceIPFS {
  AUDIO = 'Audio',
  ARTWORK = 'Artwork'
}

const TIMEOUT = parseInt(process.env.METADATA_REQUEST_TIMEOUT!)

// TODO: change to take into account nfts, processed tracks, and errors
export const missingMimeType: (source: SourceIPFS) => Trigger<undefined> = (source) => {
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

export const addMimeTypeToProcessedTracks: (source: SourceIPFS) => Processor =
  (source) => ({
    name: `addLossy${source}MimeTypeToProcessedTracks`,
    trigger: missingMimeType(source),
    processorFunction: async (processedTracks: ProcessedTrack[], clients: Clients) => {
      console.log(`Fetching processed track ${source} mime types`);

      const metadataErrors: { metadataError: string, nftId: string }[] = [];

      const updatedMimeTypes = async (processedTrack: any) => {
        const id = processedTrack.id;
        const ipfsHash = processedTrack[`lossy${source}IPFSHash`];
        let response: any;

        try {
          response = await clients.axios.head(`${process.env.IPFS_ENDPOINT}${ipfsHash}`, { timeout: TIMEOUT })
        } catch {

        }

        // TODO: error when content type is not MimeEnum
        const result: any = { id: id }
        result[`lossy${source}MimeType`] = response.headers['content-type'];
        return result;
      }

      const results = await rollPromises<ProcessedTrack, any, void>(
        processedTracks,
        updatedMimeTypes,
      );
      const updates = results.map(result => result.response)

      await clients.db.update(Table.processedTracks, updates);
      // await clients.db.upsert(Table.nftProcessErrors, metadataErrors, 'nftId', ['metadataError']);
    },
    initialCursor: undefined
  })
