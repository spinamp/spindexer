import { nonAudioTracks } from '../../triggers/nonAudio';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/track';

const name = 'stripNonAudio';

const processorFunction = async (tracks: Track[], clients: Clients) => {
  console.log(`Processing updates for tracks with: ${tracks.map(t => t.metadata?.mimeType)}`);
  const deletion = tracks.map((t: Track) => t.id);
  await clients.db.delete('tracks', deletion);
  console.log('Deleted');
};

export const stripNonAudio: Processor = {
  name,
  trigger: nonAudioTracks,
  processorFunction,
  initialCursor: undefined
};
