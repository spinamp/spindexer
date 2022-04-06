import db from './db/local-db';
import subgraph from './clients/subgraph';
import ethereum from './clients/ethereum';
import axios from './clients/axios';
import ipfs from './clients/ipfs';
import catalog from './clients/catalog';
import { Clients, Processor } from './types/processor';

export const runProcessors = async (processors: Processor[]) => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(process.env.SUBGRAPH_ENDPOINT!);
  const ethClient = await ethereum.init();
  const axiosClient = await axios.init();
  const ipfsClient = await ipfs.init();
  const catalogClient = await catalog.init();

  const clients: Clients = {
    eth: ethClient,
    db: dbClient,
    subgraph: subgraphClient,
    axios: axiosClient,
    ipfs: ipfsClient,
    catalog: catalogClient
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
  console.info(`DB has ${numberOfTracks} tracks`);
  return false;
};

const runProcessor = async (processor: Processor, clients: Clients) => {
  const cursor = await clients.db.getCursor(processor.name) || processor.initialCursor;
  const newTriggerItems = await processor.trigger(clients, cursor);
  if (newTriggerItems.length === 0) {
    return true;
  }
  console.info(`Running ${processor.name} processor.`)
  await processor.processorFunction(newTriggerItems, clients);
  return false;
}
