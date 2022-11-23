

import { Table } from '../../db/db';
import { missingLossyArtworkMimeType, missingLossyAudioMimeType } from '../../triggers/nonAudio';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { rollPromises } from '../../utils/rollingPromises';

export const addLossyArtworkMimeTypeToProcessedTracks: Processor = {
  name: 'addLossyArtworkMimeTypeToProcessedTracks',
  trigger: missingLossyArtworkMimeType,
  processorFunction: async (processedTracks: ProcessedTrack[], clients: Clients) => {

    console.log(`Fetching processed track artwork mime types`);

    const updatedMimeTypes = async (processedTrack: any) => {
      const { id, lossyArtworkIPFSHash } = processedTrack;
      const response = await clients.axios.head(`${process.env.IPFS_ENDPOINT}${lossyArtworkIPFSHash}`, { timeout: 7000 })
      return { id: id, lossyArtworkMimeType: response.headers['content-type'] }
    }

    const results = await rollPromises<ProcessedTrack, any, void>(
      processedTracks,
      updatedMimeTypes,
    );

    const updates = results.map(result => result.response)

    await clients.db.update(Table.processedTracks, updates);
  },
  initialCursor: undefined
};

export const addLossyAudioMimeTypeToProcessedTracks: Processor = {
  name: 'addLossyAudioMimeTypeToProcessedTracks',
  trigger: missingLossyAudioMimeType,
  processorFunction: async (processedTracks: ProcessedTrack[], clients: Clients) => {

    console.log(`Fetching processed track audio mime types`);

    const updatedMimeTypes = async (processedTrack: any) => {
      const { id, lossyAudioIPFSHash } = processedTrack;
      const response = await clients.axios.head(`${process.env.IPFS_ENDPOINT}${lossyAudioIPFSHash}`, { timeout: 7000 })
      return { id: id, lossyAudioMimeType: response.headers['content-type'] }
    }

    const results = await rollPromises<ProcessedTrack, any, void>(
      processedTracks,
      updatedMimeTypes,
    );

    const updates = results.map(result => result.response)

    await clients.db.update(Table.processedTracks, updates);
  },
  initialCursor: undefined
};
