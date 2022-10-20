import 'dotenv/config';
import '../src/types/env';

import knex from 'knex';

import { Table } from '../src/db/db';
import config from '../src/db/knexfile';

const start = async () => {
  const currentConfig = config[process.env.NODE_ENV]
  const initialConfig = {
    ...currentConfig,
    connection: {
      ...currentConfig.connection,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.NODE_ENV === 'production',
    }
  };
  console.log('Clearing seeds...');
  const initialDB = knex(initialConfig);
  await initialDB.raw(`DELETE FROM ${Table.seeds}`);
  console.log('Done');
  process.exit(0);
}

start();
