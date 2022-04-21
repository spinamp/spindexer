import db from './db/sql-db';
import subgraph from './clients/subgraph';
import ethereum from './clients/ethereum';
import axios from './clients/axios';
import ipfs from './clients/ipfs';
import catalog from './clients/catalog';
import noizd from './clients/noizd';
import { Clients, Processor } from './types/processor';
import sound from './clients/sound';

export const runProcessors = async (processors: Processor[]) => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(process.env.SUBGRAPH_ENDPOINT!);
  const ethClient = await ethereum.init();
  const axiosClient = await axios.init();
  const ipfsClient = await ipfs.init();
  const catalogClient = await catalog.init();
  const soundClient = await sound.init();
  const noizdClient = await noizd.init();

  const clients: Clients = {
    eth: ethClient,
    db: dbClient,
    subgraph: subgraphClient,
    axios: axiosClient,
    ipfs: ipfsClient,
    catalog: catalogClient,
    sound: soundClient,
    noizd: noizdClient
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
  const numberOfProcessedTracks = await dbClient.getNumberRecords('processedTracks');
  console.info(`DB has ${numberOfTracks} tracks`);
  console.info(`DB has ${numberOfProcessedTracks} processed tracks`);
  await dbClient.close();
  return false;
};

const runProcessor = async (processor: Processor, clients: Clients) => {
  const cursor = await clients.db.getCursor(processor.name) || processor.initialCursor;
  const triggerOutput = await processor.trigger(clients, cursor);
  if (Array.isArray(triggerOutput) && triggerOutput.length === 0) {
    return true;
  }
  console.info(`Running ${processor.name} processor.`)
  await processor.processorFunction(triggerOutput, clients);
  return false;
}
