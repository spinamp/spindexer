import db from './db/local-db';
import subgraph from './clients/subgraph';
import ethereum from './clients/ethereum';
import { Clients, Processor } from './types/processor';

export const runProcessors = async (processors: Processor[]) => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(process.env.SUBGRAPH_ENDPOINT!);
  const ethClient = await ethereum.init();

  const clients: Clients = {
    eth: ethClient,
    db: dbClient,
    subgraph: subgraphClient,
  };

  // This runs each processor until completion serially. We could consider
  // alternate orders or parallelization in future or allow for explicit
  // control over the order to be set, for example if there are dependencies
  // between processors.
  for (const processor of processors) {
    let processingComplete = false;
    while (!processingComplete) {
      processingComplete = await runProcessor(processor, clients);
    }
  }

  const numberOfTracks = await dbClient.getNumberRecords('tracks');
  const lastProcessedDBBlock = await dbClient.getCursor('createTracksFromNFTs');
  console.info(`DB has ${numberOfTracks} tracks and has processed up to ${lastProcessedDBBlock}`);
  return false;
};

const runProcessor = async (processor: Processor, clients: Clients) => {
  const cursor = await clients.db.getCursor(processor.name) || processor.initialCursor;
  const newTriggerItems = await processor.trigger(clients, cursor);
  if (newTriggerItems.length === 0) {
    return true;
  }
  await processor.processorFunction(newTriggerItems, clients);
  return false;
}
