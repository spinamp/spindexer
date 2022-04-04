import { extractHashFromURL } from '../../clients/ipfs';
import { missingPlatform } from '../../triggers/missing';
import { MusicPlatform } from '../../types/platforms';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/tracks';

const name = 'fillInPlatform';

const getPlatform = (track: Track): MusicPlatform => {
  const contractAddress = track.id.split('/')[0];
  switch (contractAddress) {
    case '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7':
      return MusicPlatform.zora;
    case '0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6':
      return MusicPlatform.noizd;
    default:
      return MusicPlatform.sound;
  }
}

const processorFunction = async (tracks: Track[], clients: Clients) => {
  console.log(`Processing updates from ${tracks[0].id}`)
  const trackUpdates = tracks.map(t => ({
    id: t.id,
    platform: getPlatform(t)
  }))
  await clients.db.update('tracks', trackUpdates);
};

export const fillInPlatform: Processor = {
  name,
  trigger: missingPlatform,
  processorFunction,
  initialCursor: undefined
};
