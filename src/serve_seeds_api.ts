import 'dotenv/config';

import db from '../src/db/sql-db';

import { createSeedsAPIServer } from './seeds/server';

const serveSeedsAPI = async () => {
  const dbClient = await db.init();
  createSeedsAPIServer(dbClient).listen(process.env.SEEDS_API_PORT, () => {
    console.log(`Server running on port ${process.env.SEEDS_API_PORT}`);
  });
}

process.on('SIGINT', () => {
  console.log('Exiting...');
  setTimeout(() => process.exit(), 0);
});

serveSeedsAPI();
