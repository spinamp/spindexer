import db from './db/local-db';
import subgraph, { SubgraphClient } from './clients/subgraph';
import ethereum, { EthClient } from './clients/ethereum';
import { DBClient } from './db/db';
import { Processor } from './types/processor';

export const runProcessors = async (processors: Processor[]) => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(process.env.SUBGRAPH_ENDPOINT!);
  const ethClient = await ethereum.init();

  let processingComplete = false;
  for (const processor of processors) {
    const processorComplete = await runProcessor(processor, subgraphClient, ethClient, dbClient);
    processingComplete = processingComplete && processorComplete;
  }

  const numberOfTracks = await dbClient.getNumberRecords('tracks');
  const lastProcessedDBBlock = await dbClient.getLastProcessedBlock('createTracksFromNFTs');
  console.log(`DB has ${numberOfTracks} tracks and has processed up to ${lastProcessedDBBlock}`);
  return false;
};

const runProcessor = async (processor: Processor, subgraphClient: SubgraphClient, ethClient: EthClient, dbClient: DBClient) => {
  let lastProcessedDBBlock = await dbClient.getLastProcessedBlock(processor.name);
  const newTriggerItems = await processor.trigger(subgraphClient, lastProcessedDBBlock);
  if (newTriggerItems.length === 0) {
    return true;
  }
  await processor.processorFunction(newTriggerItems, ethClient, dbClient);
  return false;
}
