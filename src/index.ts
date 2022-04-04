import 'dotenv/config';
import { addTrackMetadata } from './processors/default/addTrackMetadata';
import { addTrackMetadataIPFSHash } from './processors/default/addTrackMetadataIPFSHash';
import { categorizeZora } from './processors/default/categorizeZora';
import { createTracksFromNFTsProcessor } from './processors/default/createTracksFromNFTs';
import { stripNonAudio } from './processors/default/stripNonAudio';
import { runProcessors } from './runner';

const PROCESSORS = [
  createTracksFromNFTsProcessor,
  addTrackMetadataIPFSHash,
  addTrackMetadata,
  stripNonAudio,
  categorizeZora,
];

const updateDBLoop = async () => {
  await runProcessors(PROCESSORS);
};

process.on('SIGINT', () => {
  console.log("Exiting...");
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
