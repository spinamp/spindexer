import { EthClient } from '../../clients/ethereum';
import { DBClient, PartialRecord } from '../../db/db';
import { newNFTsCreated } from '../../triggers/newNFTsCreated';
import { filterUntimestampedTracks, NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/tracks';

const name = 'augmentTracksWithTimestamp';

export const createTrackUpdatesFromNFTs = async (nfts: NFT[], dbClient: DBClient, ethClient: EthClient) => {
  const newTrackNFTs = await filterUntimestampedTracks(nfts, dbClient);
  const trackUpdates = newTrackNFTs.map((nft, index) => {
    console.info(`Processing timestamp for track ${nft.track.id}`);
    return {
      id: nft.track.id,
      createdAtBlockNumber: nft.createdAtBlockNumber,
    }
  });
  return trackUpdates;
};

const processorFunction = async (newNFTs: NFT[], clients: Clients) => {
  const newProcessedDBBlock = parseInt(newNFTs[newNFTs.length - 1].createdAtBlockNumber);
  const trackUpdates: PartialRecord<Track>[] = await createTrackUpdatesFromNFTs(newNFTs, clients.db, clients.eth);
  console.log(`Processing timestamp updates for tracks`);
  await clients.db.update('tracks', trackUpdates);
  await clients.db.updateProcessor(name, newProcessedDBBlock);
};

export const augmentTracksWithTimestamp: Processor = {
  name,
  trigger: newNFTsCreated,
  processorFunction,
  initialCursor: parseInt(process.env.GLOBAL_STARTING_BLOCK!),
};
