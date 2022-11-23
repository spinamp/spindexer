import { Table } from '../../db/db';
import { missingMimeType } from '../../triggers/nonAudio';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack, SourceIPFS } from '../../types/track';
import { rollPromises } from '../../utils/rollingPromises';

export const addMimeTypeToProcessedTracks: (source: SourceIPFS) => Processor =
  (source) => ({
    name: `addLossy${source}MimeTypeToProcessedTracks`,
    trigger: missingMimeType(source),
    processorFunction: async (processedTracks: ProcessedTrack[], clients: Clients) => {
      console.log(`Fetching processed track ${source} mime types`);

      const updatedMimeTypes = async (processedTrack: any) => {
        const id = processedTrack.id;
        const ipfsHash = processedTrack[`lossy${source}IPFSHash`];
        const response = await clients.axios.head(`${process.env.IPFS_ENDPOINT}${ipfsHash}`, { timeout: 7000 })

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
    },
    initialCursor: undefined
  })
