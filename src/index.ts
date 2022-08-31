import 'dotenv/config';
import './types/env';

import _ from 'lodash';

import { Table } from './db/db';
import db from './db/sql-db';
import { addMetadataIPFSHashProcessor } from './processors/default/addMetadataIPFSHash';
import { addMetadataObjectProcessor } from './processors/default/addMetadataObject';
import { addTimestampFromMetadata } from './processors/default/addTimestampFromMetadata';
import { addTimestampToERC721NFTs, addTimestampToERC721Transfers } from './processors/default/addTimestampToERC721NFTs';
import { categorizeZora } from './processors/default/categorizeZora';
import { createERC721NFTsFromTransfersProcessor } from './processors/default/createERC721NFTsFromTransfersProcessor';
import { createNftFactoryFromERC721MetaFactoryProcessor } from './processors/default/createNftFactoryFromERC721MetaFactory';
import { createNinaNfts } from './processors/default/createNinaNftProcesor';
import { createProcessedTracksFromAPI } from './processors/default/createProcessedTracksFromAPI';
import { stripIgnoredNFTs, stripNonAudio } from './processors/default/deleter';
import { errorProcessor } from './processors/default/errorProcessor';
import { getERC721ContractFieldsProcessor } from './processors/default/getERC721ContractFieldsProcessor';
import { getERC721TokenFieldsProcessor } from './processors/default/getERC721TokenFieldsProcessor';
import { ipfsArtworkUploader, ipfsAudioUploader } from './processors/default/ipfsMediaUploader';
import { ipfsAudioPinner, ipfsArtworkPinner } from './processors/default/ipfsPinner';
import { processPlatformTracks } from './processors/default/processPlatformTracks/processPlatformTracks';
import { runProcessors } from './runner';
import { MetaFactory } from './types/metaFactory';
import { NftFactory, NFTStandard } from './types/nft';
import { MusicPlatform } from './types/platform';

export const apiPlatforms = ['noizd']; //TODO: noizd here is being used both as platformId and MusicPlatformType. Need to avoid mixing them

const PROCESSORS = (nftFactories: NftFactory[], metaFactories: MetaFactory[], musicPlatforms: MusicPlatform[]) => {
  const nftFactoriesByAddress = _.keyBy(nftFactories, 'address');

  const metaFactoryProcessors = metaFactories.map(contract => createNftFactoryFromERC721MetaFactoryProcessor(contract));
  const erc721TransferProcessors = createERC721NFTsFromTransfersProcessor(nftFactories);
  const platformTrackProcessors = musicPlatforms.map(musicPlatform => processPlatformTracks(musicPlatform));
  const apiTrackProcessors = apiPlatforms.map(apiPlatform => createProcessedTracksFromAPI(apiPlatform));

  return [
    ...metaFactoryProcessors,
    getERC721ContractFieldsProcessor,
    erc721TransferProcessors,
    stripIgnoredNFTs,
    addTimestampToERC721Transfers,
    addTimestampToERC721NFTs,
    getERC721TokenFieldsProcessor(nftFactoriesByAddress),
    addMetadataIPFSHashProcessor(nftFactoriesByAddress),
    addMetadataObjectProcessor(nftFactoriesByAddress),
    stripNonAudio,
    categorizeZora,
    createNinaNfts,
    addTimestampFromMetadata,
    ...platformTrackProcessors,
    ...apiTrackProcessors,
    ipfsAudioUploader,
    ipfsArtworkUploader,
    ipfsAudioPinner,
    ipfsArtworkPinner,
    errorProcessor,
  ]
};

const updateDBLoop = async () => {
  const dbClient = await db.init();
  const nftFactories = await dbClient.getRecords<NftFactory>(Table.nftFactories);
  const erc721MetaFactories = await dbClient.getRecords<MetaFactory>(Table.metaFactories, [
    [
      'where', ['standard', NFTStandard.ERC721.toString()]
    ]
  ]);
  const musicPlatforms = await dbClient.getRecords<MusicPlatform>(Table.platforms);
  await runProcessors(PROCESSORS(nftFactories, erc721MetaFactories, musicPlatforms), dbClient);
};

process.on('SIGINT', () => {
  console.log('Exiting...');
  setTimeout(() => process.exit(), 0);
});

updateDBLoop();
