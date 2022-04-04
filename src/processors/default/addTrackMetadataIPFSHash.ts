import { extractHashFromURL } from '../../clients/ipfs';
import { missingMetadataIPFSHash } from '../../triggers/missing';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/tracks';

const name = 'addTrackMetadataIPFSHash';

const getMetadataIPFSHash = (track: Track): (string | null | undefined) => {
  if (!track.tokenMetadataURI) {
    return undefined;
  }
  const hash = extractHashFromURL(track.tokenMetadataURI);
  return hash || null;
}

const processorFunction = async (tracks: Track[], clients: Clients) => {
  console.log(`Processing updates from ${tracks[0].id}`)
  const trackUpdates = tracks.map(t => ({
    id: t.id,
    metadataIPFSHash: getMetadataIPFSHash(t)
  }))
  const filteredTrackUpdates = trackUpdates.filter(t => (t.metadataIPFSHash !== undefined));
  await clients.db.update('tracks', filteredTrackUpdates);
};

export const addTrackMetadataIPFSHash: Processor = {
  name,
  trigger: missingMetadataIPFSHash,
  processorFunction,
  initialCursor: undefined
};
