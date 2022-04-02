import 'dotenv/config';
import { createTracksFromNFTsProcessor } from './processors/createTracksFromNFTs';
import { runProcessors } from './runner';

const PROCESSORS = [
  createTracksFromNFTsProcessor,
];

const updateDBLoop = async () => {
  let dbIsUpdated = false;
  while (!dbIsUpdated) {
    dbIsUpdated = await runProcessors(PROCESSORS);
  }
}

updateDBLoop();
