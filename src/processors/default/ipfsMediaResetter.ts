import { Table } from '../../db/db';
import { artworkChanged } from '../../triggers/ipfs';
import { IPFSFile } from '../../types/ipfsFIle';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';

type TrackFileJoin = ProcessedTrack & Partial<IPFSFile>;

function processorFunction(resetField: 'lossyAudioIPFSHash' | 'lossyArtworkIPFSHash') {
  return async (tracksWithIPFSFiles: TrackFileJoin[], clients: Clients) => {
    const updates: Partial<ProcessedTrack>[] = [];
    const deletions: string[] = [];

    tracksWithIPFSFiles.forEach((trackWithFile: TrackFileJoin) => {
      delete trackWithFile['url']
      delete trackWithFile['error'];
      delete trackWithFile['cid'];

      const track: ProcessedTrack = {
        ...trackWithFile
      }

      updates.push({
        ...track,
        [resetField]: null
      })
    })

    if (updates.length > 0) {
      await clients.db.update(Table.processedTracks, updates);
    }
  }
}

export const ipfsArtworkResetter: Processor = ({
  name: 'ipfsArtworkResetter',
  trigger: artworkChanged,
  processorFunction: processorFunction('lossyArtworkIPFSHash'),
  initialCursor: undefined
});
