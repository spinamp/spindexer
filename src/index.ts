import db from './local-db';
import subgraph from './subgraph';
import { processNFTs } from './nfts';

const SUBGRAPH_ENDPOINT = `http://localhost:8000/subgraphs/name/web3-music-minimal`;

const updateDBBatch = async () => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(SUBGRAPH_ENDPOINT);

  let lastProcessedDBBlock = await dbClient.getLastProcessedBlock();
  const latestNFT = await subgraphClient.getLatestNFT();
  const lastProcessedSubGraphBlock = parseInt(latestNFT.createdAtBlockNumber);

  if (lastProcessedSubGraphBlock === lastProcessedDBBlock) {
    console.log(`DB up to date.`);
    return true;
  }

  let numberOfNFTs = await dbClient.getNumberNFTs();
  console.log(`DB has ${numberOfNFTs} nfts and has processed up to ${lastProcessedDBBlock}`);
  console.log(`Processing next batch from block ${lastProcessedDBBlock}`);

  const newNFTs = await subgraphClient.getNFTsFrom(lastProcessedDBBlock + 1);
  if (newNFTs.length === 0) {
    return false;
  }
  const newProcessedDBBlock = parseInt(newNFTs[newNFTs.length - 1].createdAtBlockNumber);
  const processedNFTs = processNFTs(newNFTs);
  await dbClient.update('nfts', processedNFTs, newProcessedDBBlock);

  numberOfNFTs = await dbClient.getNumberNFTs();
  lastProcessedDBBlock = await dbClient.getLastProcessedBlock();
  console.log(`DB has ${numberOfNFTs} nfts and has processed up to ${lastProcessedDBBlock}`);
  return false;
};

const updateDBLoop = async () => {
  let dbIsUpdated = false;
  while (!dbIsUpdated) {
    dbIsUpdated = await updateDBBatch();
  }
}

updateDBLoop();
