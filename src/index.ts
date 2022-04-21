import 'dotenv/config';
import './types/env';
import { addMetadataIPFSHashProcessor } from './processors/default/addMetadataIPFSHash';
import { addMetadataObjectProcessor } from './processors/default/addMetadataObject';
import { categorizeZora } from './processors/default/categorizeZora';
import { createMetadatasFromNFTsProcessor } from './processors/default/createMetadatasFromNFTs';
import { createNFTsFromERC721TransfersProcessor } from './processors/default/createNFTsFromERC721Transfers';
import { createNFTsFromSubgraphProcessor } from './processors/default/createNFTsFromSubgraph';
import { createProcessedTracksFromAPI } from './processors/default/createProcessedTracksFromAPI';
import { processPlatformTracks } from './processors/default/processPlatformTracks';
import { stripNonAudio } from './processors/default/stripNonAudio';
import { runProcessors } from './runner';
import { NewCatalogContract } from './types/ethereum';
import { MusicPlatform } from './types/platform';

const PROCESSORS = [
  createNFTsFromSubgraphProcessor,
  createNFTsFromERC721TransfersProcessor(NewCatalogContract),
  // createMetadatasFromNFTsProcessor,
  // addMetadataIPFSHashProcessor,
  // addMetadataObjectProcessor,
  // stripNonAudio,
  // categorizeZora,
  // processPlatformTracks(MusicPlatform.catalog),
  // processPlatformTracks(MusicPlatform.sound, 1),
  // processPlatformTracks(MusicPlatform.noizd),
  // createProcessedTracksFromAPI(MusicPlatform.noizd),
];

const updateDBLoop = async () => {
  await runProcessors(PROCESSORS);
};

process.on('SIGINT', () => {
  console.log('Exiting...');
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
