import { EthClient } from '../clients/ethereum';
import { DBClient } from '../db/db';
import { processTracksFromNFTs } from '../nfts';
import { newNFTsCreated } from '../triggers/nft';
import { NFT } from '../types/nft';
import { Processor } from '../types/processor';

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
