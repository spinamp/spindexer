import 'dotenv/config';
import { addTrackMetadataProcessor } from './processors/addTrackMetadata';
import { createTracksFromNFTsProcessor } from './processors/createTracksFromNFTs';
import { runProcessors } from './runner';

const PROCESSORS = [
  createTracksFromNFTsProcessor,
  addTrackMetadataProcessor,
];

const updateDBLoop = async () => {
  await runProcessors(PROCESSORS);
};

updateDBLoop();
