import 'dotenv/config';
import './types/env';
import _ from 'lodash';

import { Table } from './db/db';
import db from './db/sql-db';
import { addMetadataIPFSHashProcessor } from './processors/default/addMetadataIPFSHash';
import { addMetadataObjectProcessor } from './processors/default/addMetadataObject';
import { addTimestampToERC721NFTs, addTimestampToERC721Transfers } from './processors/default/addTimestampToERC721NFTs';
import { categorizeZora } from './processors/default/categorizeZora';
import { createERC721ContractFromFactoryProcessor } from './processors/default/createERC721ContractFromFactoryProcessor';
import { createERC721NFTsFromTransfersProcessor } from './processors/default/createERC721NFTsFromTransfersProcessor';
import { createProcessedTracksFromAPI } from './processors/default/createProcessedTracksFromAPI';
import { stripIgnoredNFTs, stripNonAudio } from './processors/default/deleter';
import { getERC721ContractFieldsProcessor } from './processors/default/getERC721ContractFieldsProcessor';
import { getERC721TokenFieldsProcessor } from './processors/default/getERC721TokenFieldsProcessor';
import { ipfsAudioPinner, ipfsArtworkPinner } from './processors/default/ipfs';
import { processPlatformTracks } from './processors/default/processPlatformTracks';
import { runProcessors } from './runner';
import { ERC721Contract, FactoryContract } from './types/ethereum';
import { MusicPlatform } from './types/platform';


const PROCESSORS = (erc721Contracts: ERC721Contract[], factoryContracts: FactoryContract[], musicPlatforms: MusicPlatform[]) => {
  const erc721ContractsByAddress = _.keyBy(erc721Contracts, 'address');

  const factoryContractProcessors = factoryContracts.map(contract => createERC721ContractFromFactoryProcessor(contract));
  const erc721TransferProcessors = createERC721NFTsFromTransfersProcessor(erc721Contracts);
  const platformTrackProcessors = musicPlatforms.map(musicPlatform => processPlatformTracks(musicPlatform));

  return [
    ...factoryContractProcessors,
    getERC721ContractFieldsProcessor,
    erc721TransferProcessors,
    stripIgnoredNFTs,
    addTimestampToERC721Transfers,
    addTimestampToERC721NFTs,
    getERC721TokenFieldsProcessor(erc721ContractsByAddress),
    addMetadataIPFSHashProcessor(erc721ContractsByAddress),
    addMetadataObjectProcessor(erc721ContractsByAddress),
    stripNonAudio,
    categorizeZora,
    ...platformTrackProcessors,
    createProcessedTracksFromAPI('noizd'), //TODO: noizd here is being used both as platformId and MusicPlatformType. Need to bring in the full noizd platform object here and avoid mixing them
    ipfsAudioPinner,
    ipfsArtworkPinner,
  ]
};

const updateDBLoop = async () => {
  const dbClient = await db.init();
  const erc721Contracts = await dbClient.getRecords<ERC721Contract>(Table.erc721Contracts);
  const factoryContracts = await dbClient.getRecords<FactoryContract>(Table.factoryContracts);
  const musicPlatforms = await dbClient.getRecords<MusicPlatform>(Table.platforms);
  await runProcessors(PROCESSORS(erc721Contracts, factoryContracts, musicPlatforms), dbClient);
};

process.on('SIGINT', () => {
  console.log('Exiting...');
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
