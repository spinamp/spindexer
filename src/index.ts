import 'dotenv/config';
import { createTracksFromNFTsProcessor } from './processors/createTracksFromNFTs';
import { runProcessors } from './runner';

const PROCESSORS = [
  createTracksFromNFTsProcessor,
];

const updateDBLoop = async () => {
  await runProcessors(PROCESSORS);
};

updateDBLoop();
