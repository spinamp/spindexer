import 'dotenv/config';
import { addTrackMetadata } from './processors/addTrackMetadata';
import { addTrackMetadataIPFSHash } from './processors/addTrackMetadataIPFSHash';
import { createTracksFromNFTsProcessor } from './processors/createTracksFromNFTs';
import { runProcessors } from './runner';

const PROCESSORS = [
  createTracksFromNFTsProcessor,
  addTrackMetadataIPFSHash,
  addTrackMetadata,
];

const updateDBLoop = async () => {
  await runProcessors(PROCESSORS);
};

process.on('SIGINT', function () {
  console.log("Exiting...");
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
