import 'dotenv/config';
import './types/env';
import _ from 'lodash';

import db from './db/sql-db';
import { addMetadataIPFSHashProcessor } from './processors/default/addMetadataIPFSHash';
import { addMetadataObjectProcessor } from './processors/default/addMetadataObject';
import { categorizeZora } from './processors/default/categorizeZora';
import { createERC721ContractFromFactoryProcessor } from './processors/default/createERC721ContractFromFactoryProcessor';
import { createMetadatasFromNFTsProcessor } from './processors/default/createMetadatasFromNFTs';
import { createNFTsFromERC721TransfersProcessor } from './processors/default/createNFTsFromERC721Transfers';
import { createProcessedTracksFromAPI } from './processors/default/createProcessedTracksFromAPI';
import { stripIgnoredNFTs, stripNonAudio } from './processors/default/deleter';
import { processPlatformTracks } from './processors/default/processPlatformTracks';
import { runProcessors } from './runner';
import { ERC721Contract, FactoryContract } from './types/ethereum';
import { MusicPlatform } from './types/platform';


const PROCESSORS = (erc721Contracts:ERC721Contract[], factoryContracts:FactoryContract[]) => {
  const erc721ContractsByAddress = _.keyBy(erc721Contracts, 'address');

  const erc721TransferProcessors = erc721Contracts.map(contract => createNFTsFromERC721TransfersProcessor(contract));
  const factoryContractProcessors = factoryContracts.map(contract => createERC721ContractFromFactoryProcessor(contract));

  return [
  ...factoryContractProcessors,
  ...erc721TransferProcessors,
  // stripIgnoredNFTs,
  createMetadatasFromNFTsProcessor(erc721ContractsByAddress),
  addMetadataIPFSHashProcessor,
  addMetadataObjectProcessor,
  // stripNonAudio,
  // categorizeZora,
  // createSoundMetadataIds,
  processPlatformTracks(MusicPlatform.catalog),
  processPlatformTracks(MusicPlatform.sound, 3),
  processPlatformTracks(MusicPlatform.noizd),
  createProcessedTracksFromAPI(MusicPlatform.noizd),
]};

const updateDBLoop = async () => {
  const dbClient = await db.init();
  const erc721Contracts = await dbClient.getRecords<ERC721Contract>('erc721Contracts');
  const factoryContracts = await dbClient.getRecords<FactoryContract>('factoryContracts');
  await runProcessors(PROCESSORS(erc721Contracts, factoryContracts), dbClient);
};

process.on('SIGINT', () => {
  console.log('Exiting...');
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
