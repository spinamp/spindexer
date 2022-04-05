import { zoraRaw } from '../../triggers/zora';
import { getZoraPlatform } from '../../types/platforms/catalog';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/track';

export const categorizeZora: Processor = {
  name: 'categorizeZora',
  trigger: zoraRaw,
  processorFunction: async (tracks: Track[], clients: Clients) => {
    console.log(`Processing updates for tracks with: ${tracks.map(t => t.platform)}`);
    const trackUpdates = tracks.map((t: Track) => ({
      id: t.id,
      platform: getZoraPlatform(t),
    }));
    await clients.db.update('tracks', trackUpdates);
    console.log('Updated');
  },
  initialCursor: undefined
};
