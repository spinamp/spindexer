import { missingMetadataIPFSHash } from '../triggers/empty';
import { Clients, Processor } from '../types/processor';
import { Track } from '../types/tracks';

const name = 'addTrackMetadataIPFSHash';

const extractHashFromURL = (urlString: string) => {
  try {
    const url = new URL(urlString);
    if (url.protocol === 'ipfs:') {
      return url.host;
    }
    if (url.pathname.startsWith('/ipfs/')) {
      return url.pathname.slice(url.pathname.lastIndexOf('/ipfs/') + 6);
    }
    if (url.host.includes('.ipfs.')) {
      return url.host.split('.ipfs.')[0];
    }
    return null;
  } catch {
    return null;
  }
}

const getMetadataIPFSHash = (track: Track): (string | null | undefined) => {
  if (!track.tokenMetadataURI) {
    return undefined;
  }
  const hash = extractHashFromURL(track.tokenMetadataURI);
  return hash || null;
}

const processorFunction = async (tracks: Track[], clients: Clients) => {
  console.log(`Processing updates from ${tracks[0].id}`)
  console.log({ zero: tracks[0] })
  const trackUpdates = tracks.map(t => ({
    id: t.id,
    metadataIPFSHash: getMetadataIPFSHash(t)
  }))
  const filteredTrackUpdates = trackUpdates.filter(t => (t.metadataIPFSHash !== undefined));
  // console.log({ filteredTrackUpdates })
  await clients.db.update('tracks', filteredTrackUpdates);
};

export const addTrackMetadataIPFSHash: Processor = {
  name,
  trigger: missingMetadataIPFSHash,
  processorFunction,
  initialCursor: undefined
};
