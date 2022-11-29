import 'dotenv/config';
import '../src/types/env';
import knex from 'knex';

import config from '../src/db/knexfile';
import { updateViews } from '../src/db/migration-helpers';

const start = async () => {
  const currentEnv = process.env.NODE_ENV;
  const currentConfig = config[currentEnv]
  console.log(`Rebuilding DB views for ${currentEnv} environment database: '${currentConfig.connection.database}'...`);

  const db = knex(currentConfig);
  await updateViews(db);

  console.log('Done');
  process.exit(0);
}

start();
