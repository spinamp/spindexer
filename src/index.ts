import 'dotenv/config';
import './types/env';
import _ from 'lodash';

import db from './db/sql-db';
import { addMetadataIPFSHashProcessor } from './processors/default/addMetadataIPFSHash';
import { addMetadataObjectProcessor } from './processors/default/addMetadataObject';
import { categorizeZora } from './processors/default/categorizeZora';
import { createMetadatasFromNFTsProcessor } from './processors/default/createMetadatasFromNFTs';
import { createNFTsFromERC721TransfersProcessor } from './processors/default/createNFTsFromERC721Transfers';
import { createNFTsFromSubgraphProcessor } from './processors/default/createNFTsFromSubgraph';
import { createProcessedTracksFromAPI } from './processors/default/createProcessedTracksFromAPI';
import { stripIgnoredNFTs, stripNonAudio } from './processors/default/deleter';
import { processPlatformTracks } from './processors/default/processPlatformTracks';
import { runProcessors } from './runner';
import { ERC721Contract } from './types/ethereum';
import { MusicPlatform } from './types/platform';


const PROCESSORS = (erc721Contracts:ERC721Contract[]) => {
  const erc721TransferProcessors = erc721Contracts.map(contract => createNFTsFromERC721TransfersProcessor(contract));
  const erc721ContractsByAddress = _.keyBy(erc721Contracts, 'address');
  return [
  // createNFTsFromSubgraphProcessor,
   ...erc721TransferProcessors,
  stripIgnoredNFTs,
  createMetadatasFromNFTsProcessor(erc721ContractsByAddress),
  addMetadataIPFSHashProcessor,
  addMetadataObjectProcessor,
  stripNonAudio,
  categorizeZora,
  processPlatformTracks(MusicPlatform.catalog),
  processPlatformTracks(MusicPlatform.sound, 3),
  processPlatformTracks(MusicPlatform.noizd),
  createProcessedTracksFromAPI(MusicPlatform.noizd),
]};

const updateDBLoop = async () => {
  const dbClient = await db.init();
  const erc721Contracts = await dbClient.getRecords<ERC721Contract>('erc721Contracts');
  await runProcessors(PROCESSORS(erc721Contracts), dbClient);
};

process.on('SIGINT', () => {
  console.log('Exiting...');
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
