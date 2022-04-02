import { EthClient } from '../clients/ethereum';
import { DBClient } from '../db/db';
import { newNFTsCreated } from '../triggers/nft';
import { filterExistingTrackNFTs, getNFTMetadataCall, NFT } from '../types/nft';
import { Processor } from '../types/processor';

export const processTracksFromNFTs = async (nfts: NFT[], dbClient: DBClient, ethClient: EthClient) => {
  const newTrackNFTs = await filterExistingTrackNFTs(nfts, dbClient);
  const metadataCalls = newTrackNFTs.map(nft => getNFTMetadataCall(nft));
  console.info(`Processing bulk call`);
  const metadataURIs = await ethClient.call(metadataCalls)
  // todo: do metadata url calls to get all metadata and add to track record
  // todo: postfilter/zora only music&catalog filter/extra noizd calls/extra centralized calls for optimized media
  const newTracks = newTrackNFTs.map((nft, index) => {
    console.info(`Processing nft for track ${nft.track.id}`);
    return {
      record: {
        id: nft.track.id,
        tokenMetadataURI: metadataURIs[index],
      }
    }
  });
  return newTracks.map(track => track.record);
};

const processorFunction = async (newNFTs: NFT[], ethClient: EthClient, dbClient: DBClient) => {
  const newProcessedDBBlock = parseInt(newNFTs[newNFTs.length - 1].createdAtBlockNumber);
  const newTracks = await processTracksFromNFTs(newNFTs, dbClient, ethClient);
  await dbClient.insert('nfts', newNFTs);
  await dbClient.insert('tracks', newTracks);
  await dbClient.updateProcessor('createTracksFromNFTs', newProcessedDBBlock);
};

export const createTracksFromNFTsProcessor: Processor = {
  name: 'createTracksFromNFTs',
  trigger: newNFTsCreated,
  processorFunction,
};
