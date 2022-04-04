import { EthClient } from '../../clients/ethereum';
import { DBClient } from '../../db/db';
import { newNFTsCreated } from '../../triggers/newNFTsCreated';
import { filterNewTrackNFTs, getNFTMetadataCall, NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';

const name = 'createTracksFromNFTs';

export const createTracksFromNFTs = async (nfts: NFT[], dbClient: DBClient, ethClient: EthClient) => {
  const newTrackNFTs = await filterNewTrackNFTs(nfts, dbClient);
  const metadataCalls = newTrackNFTs.map(nft => getNFTMetadataCall(nft));
  console.info(`Processing bulk call`);
  const metadataURIs = await ethClient.call(metadataCalls);
  const newTracks = newTrackNFTs.map((nft, index) => {
    console.info(`Processing nft for track ${nft.track.id}`);
    return {
      record: {
        id: nft.track.id,
        platform: nft.platform,
        tokenMetadataURI: metadataURIs[index],
      }
    }
  });
  return newTracks.map(track => track.record);
};

const processorFunction = async (newNFTs: NFT[], clients: Clients) => {
  const newProcessedDBBlock = parseInt(newNFTs[newNFTs.length - 1].createdAtBlockNumber);
  const newTracks = await createTracksFromNFTs(newNFTs, clients.db, clients.eth);
  await clients.db.insert('nfts', newNFTs);
  await clients.db.insert('tracks', newTracks);
  await clients.db.updateProcessor(name, newProcessedDBBlock);
};

export const createTracksFromNFTsProcessor: Processor = {
  name,
  trigger: newNFTsCreated,
  processorFunction,
  initialCursor: parseInt(process.env.GLOBAL_STARTING_BLOCK!),
};
