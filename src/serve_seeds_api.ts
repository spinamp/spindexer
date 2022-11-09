import 'dotenv/config';

import db from '../src/db/sql-db';

import { DBClient } from './db/db';
import { createSeedsAPIServer } from './seeds/server';

let globalDBClient: DBClient;

const getDBClient = async () => {
  if (!globalDBClient) {
    globalDBClient = await db.init();
  }
  return globalDBClient;
}

const serveSeedsAPI = async () => {
  const dbClient = await getDBClient();
  createSeedsAPIServer(dbClient).listen(process.env.SEEDS_API_PORT, () => {
    console.log(`Server running on port ${process.env.SEEDS_API_PORT}`);
  });
}

process.on('SIGINT', async () => {
  console.log('Exiting...');
  const dbClient = await getDBClient();
  dbClient.close();
  setTimeout(() => process.exit(), 0);
});

serveSeedsAPI();
