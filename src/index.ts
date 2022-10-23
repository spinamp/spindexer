import 'dotenv/config';
import './types/env';


import _ from 'lodash';

import { Table } from './db/db';
import db from './db/sql-db';
import { addMetadataIPFSHashProcessor } from './processors/default/addMetadataIPFSHash';
import { addMetadataObjectProcessor } from './processors/default/addMetadataObject';
import { addTimestampFromMetadata } from './processors/default/addTimestampFromMetadata';
import { createERC721NFTsFromTransfersProcessor } from './processors/default/createERC721NFTsFromTransfersProcessor';
import { createNftFactoryFromERC721MetaFactoryProcessor } from './processors/default/createNftFactoryFromERC721MetaFactory';
import { createNftsFromCandyMachine } from './processors/default/createNftFromCandyMachine';
import { createProcessedTracksFromAPI } from './processors/default/createProcessedTracksFromAPI';
import { errorAndMetadataResetProcessor } from './processors/default/errorProcessor';
import { insertSeedsIntoMempool } from './processors/default/insertSeedsIntoMempool';
import { processMempoolInserts, processMempoolUpdates } from './processors/default/processMempool';
import { processPlatformTracks } from './processors/default/processPlatformTracks/processPlatformTracks';
import { runProcessors } from './runner';
import { MetaFactory, MetaFactoryTypeName } from './types/metaFactory';
import { NftFactory, NFTStandard } from './types/nft';
import { API_PLATFORMS, MusicPlatform } from './types/platform';

const PROCESSORS = (nftFactories: NftFactory[], metaFactories: MetaFactory[], musicPlatforms: MusicPlatform[], candyMachines: MetaFactory[]) => {
  const nftFactoriesByAddress = _.keyBy(nftFactories, 'id');

  const metaFactoryProcessors = metaFactories.map(contract => createNftFactoryFromERC721MetaFactoryProcessor(contract));
  const erc721TransferProcessors = createERC721NFTsFromTransfersProcessor(nftFactories);
  const platformTrackProcessors = musicPlatforms.map(musicPlatform => processPlatformTracks(musicPlatform));

  //TODO: noizd here is being used both as platformId and MusicPlatformType. Need to avoid mixing them
  const apiTrackProcessors = API_PLATFORMS.map(apiPlatform => createProcessedTracksFromAPI(apiPlatform));

  const crdtTables = [Table.nftFactories, Table.nfts, Table.metaFactories, Table.platforms, Table.artists, Table.processedTracks];

  const tableInsertsMempoolProcessors = crdtTables.map(table => processMempoolInserts(table));
  const tableUpdatesMempoolProcessors = crdtTables.map(table => processMempoolUpdates(table));

  const candyMachineProcessors = candyMachines.map(candyMachine => createNftsFromCandyMachine(candyMachine))

  return [
    insertSeedsIntoMempool,
    errorAndMetadataResetProcessor,
    ...tableInsertsMempoolProcessors,
    ...tableUpdatesMempoolProcessors,
    ...metaFactoryProcessors,
    ...candyMachineProcessors,
    // getERC721ContractFieldsProcessor,
    // erc721TransferProcessors,
    // addTimestampToERC721Transfers,
    // addTimestampToERC721NFTs,
    // getERC721TokenFieldsProcessor(nftFactoriesByAddress),
    addMetadataIPFSHashProcessor(nftFactoriesByAddress),
    addMetadataObjectProcessor(nftFactoriesByAddress),
    // categorizeZora,
    // createNinaNfts,
    addTimestampFromMetadata,
    ...platformTrackProcessors,
    // ...apiTrackProcessors,
    // ipfsAudioUploader,
    // ipfsArtworkUploader,
    // ipfsAudioPinner,
    // ipfsArtworkPinner,
    // errorProcessor,
    // createMetaplexNfts
  ]
};

const updateDBLoop = async () => {
  const dbClient = await db.init();
  const nftFactories = await dbClient.getRecords<NftFactory>(Table.nftFactories);
  
  const metafactories = await dbClient.getRecords<MetaFactory>(Table.metaFactories);
  const erc721MetaFactories = metafactories.filter(metaFactory => metaFactory.standard === NFTStandard.ERC721);
  const candyMachines = metafactories.filter(metaFactory => metaFactory.standard === NFTStandard.METAPLEX && metaFactory.contractType === MetaFactoryTypeName.candyMachine) 

  const musicPlatforms = await dbClient.getRecords<MusicPlatform>(Table.platforms);
  await runProcessors(PROCESSORS(nftFactories, erc721MetaFactories, musicPlatforms, candyMachines), dbClient);
};

process.on('SIGINT', () => {
  console.log('Exiting...');
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
