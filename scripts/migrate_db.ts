import 'dotenv/config';
import '../src/types/env';

import { knex } from 'knex';

import config from '../src/db/knexfile';

const start = async () => {
  const currentConfig = config[process.env.NODE_ENV]
  console.log('Migrating...');
  const db = knex(currentConfig);
  await db.migrate.latest();
  console.log('Done');
  process.exit(0);
}

start();
