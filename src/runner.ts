import axios from './clients/axios';
import blocks from './clients/blocks';
import catalog from './clients/catalog';
import ethereum from './clients/ethereum';
import ipfs from './clients/ipfs';
import noizd from './clients/noizd';
import solana from './clients/solana';
import sound from './clients/sound';
import { DBClient, Table } from './db/db';
import db from './db/sql-db';
import { Clients, Processor } from './types/processor';

export const initClients = async (existingDBClient?: DBClient) => {
  const ethClient = await ethereum.init();
  const blocksClient = await blocks.init();
  const axiosClient = await axios.init();
  const ipfsClient = await ipfs.init();
  const catalogClient = await catalog.init();
  const soundClient = await sound.init();
  const noizdClient = await noizd.init();
  const solanaClient = await solana.init();

  return {
    eth: ethClient,
    db: existingDBClient || await db.init(),
    blocks: blocksClient,
    axios: axiosClient,
    ipfs: ipfsClient,
    catalog: catalogClient,
    sound: soundClient,
    noizd: noizdClient,
    solana: solanaClient
  };
}
export const runProcessors = async (processors: Processor[], dbClient: DBClient) => {
  const clients = await initClients(dbClient);

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

  const numberOfNFTss = await dbClient.getNumberRecords(Table.nfts);
  const numberOfProcessedTracks = await dbClient.getNumberRecords(Table.processedTracks);
  console.info(`DB has ${numberOfNFTss} nfts`);
  console.info(`DB has ${numberOfProcessedTracks} processed tracks`);
  await dbClient.close();
  return false;
};

const runProcessor = async (processor: Processor, clients: Clients) => {
  let cursor: string | undefined;
  if (processor.name) {
    cursor = await clients.db.getCursor(processor.name) || processor.initialCursor;
  }
  const triggerOutput = await processor.trigger(clients, cursor);
  if (Array.isArray(triggerOutput) && triggerOutput.length === 0) {
    return true;
  }
  console.info(`Running ${processor.name} processor.`)
  await processor.processorFunction(triggerOutput, clients);
  return false;
}
