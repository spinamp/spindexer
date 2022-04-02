import 'dotenv/config';
import db from './db/local-db';
import subgraph from './clients/subgraph';
import ethereum from './clients/ethereum';
import { createTracksFromNFTsProcessor } from './processors/createTracksFromNFTs';

const updateDBBatch = async () => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(process.env.SUBGRAPH_ENDPOINT!);
  const ethClient = await ethereum.init();

  const processor = createTracksFromNFTsProcessor;
  let lastProcessedDBBlock = await dbClient.getLastProcessedBlock(processor.name);
  const newTriggerItems = await processor.trigger(subgraphClient, lastProcessedDBBlock);
  if (newTriggerItems.length === 0) {
    return false;
  }
  await processor.processorFunction(newTriggerItems, ethClient, dbClient);

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
