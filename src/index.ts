import db from './local-db';
import subgraph from './subgraph';

const SUBGRAPH_ENDPOINT = `http://localhost:8000/subgraphs/name/web3-music-minimal`;

const updateDBBatch = async () => {
  const dbClient = await db.init();
  const subgraphClient = subgraph.init(SUBGRAPH_ENDPOINT);

  let lastProcessedDBBlock = await dbClient.getLastProcessedBlock();
  const latestTrack = await subgraphClient.getLatestTrack();
  const lastProcessedSubGraphBlock = parseInt(latestTrack.createdAtBlockNumber);

  if (lastProcessedSubGraphBlock === lastProcessedDBBlock) {
    console.log(`DB up to date.`);
    return true;
  }

  let numberOfTracks = await dbClient.getNumberTracks();
  console.log(`DB has ${numberOfTracks} tracks and has processed up to ${lastProcessedDBBlock}`);
  console.log(`Processing next batch from block ${lastProcessedDBBlock}`);

  const newTracks = await subgraphClient.getTracksFrom(lastProcessedDBBlock + 1);
  if (newTracks.length === 0) {
    return false;
  }
  const newProcessedDBBlock = parseInt(newTracks[newTracks.length - 1].createdAtBlockNumber);
  await dbClient.update('tracks', newTracks, newProcessedDBBlock);

  numberOfTracks = await dbClient.getNumberTracks();
  lastProcessedDBBlock = await dbClient.getLastProcessedBlock();
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
