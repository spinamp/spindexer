import 'dotenv/config';
import db from './db/local-db';
import subgraph from './clients/subgraph';
import ethereum from './clients/ethereum';
import { processTracksFromNFTs } from './nfts';
import { newNFTsCreated } from './triggers/nft';

const updateDBBatch = async () => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(process.env.SUBGRAPH_ENDPOINT!);
  const ethClient = await ethereum.init();

  let lastProcessedDBBlock = await dbClient.getLastProcessedBlock('createTracksFromNFTs');
  const newNFTs = await newNFTsCreated(dbClient, subgraphClient, lastProcessedDBBlock);
  if (newNFTs.length === 0) {
    return false;
  }
  const newProcessedDBBlock = parseInt(newNFTs[newNFTs.length - 1].createdAtBlockNumber);
  const newTracks = await processTracksFromNFTs(newNFTs, dbClient, ethClient);
  await dbClient.insert('nfts', newNFTs);
  await dbClient.insert('tracks', newTracks);
  await dbClient.updateProcessor('createTracksFromNFTs', newProcessedDBBlock);

  const numberOfTracks = await dbClient.getNumberRecords('tracks');
  lastProcessedDBBlock = await dbClient.getLastProcessedBlock('createTracksFromNFTs');
  console.log(`DB has ${numberOfTracks} tracks and has processed up to ${lastProcessedDBBlock}`);
  return false;
};

const updateDBLoop = async () => {
  let dbIsUpdated = false;
  while (!dbIsUpdated) {
    dbIsUpdated = await updateDBBatch();
  }
}

updateDBLoop();
