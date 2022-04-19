import 'dotenv/config';
import './types/env';
import { addTrackMetadata } from './processors/default/addTrackMetadata';
import { addTrackMetadataIPFSHash } from './processors/default/addTrackMetadataIPFSHash';
import { categorizeZora } from './processors/default/categorizeZora';
import { createProcessedTracksFromAPI } from './processors/default/createProcessedTracksFromAPI';
import { createTracksFromNFTsProcessor } from './processors/default/createTracksFromNFTs';
import { processPlatformTracks } from './processors/default/processPlatformTracks';
import { stripNonAudio } from './processors/default/stripNonAudio';
import { runProcessors } from './runner';
import { MusicPlatform } from './types/platform';

const PROCESSORS = [
  createTracksFromNFTsProcessor,
  addTrackMetadataIPFSHash,
  addTrackMetadata,
  stripNonAudio,
  categorizeZora,
  processPlatformTracks(MusicPlatform.catalog),
  processPlatformTracks(MusicPlatform.sound, 1),
  processPlatformTracks(MusicPlatform.noizd),
  createProcessedTracksFromAPI(MusicPlatform.noizd),
];

const updateDBLoop = async () => {
  await runProcessors(PROCESSORS);
};

process.on('SIGINT', () => {
  console.log("Exiting...");
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
