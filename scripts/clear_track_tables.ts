import 'dotenv/config';
import '../src/types/env';
import knex from 'knex';

import { apiPlatforms } from '../src';
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
      ssl: process.env.NODE_ENV === 'production'
    }
  };
  console.log('Clearing...');
  const initialDB = knex(initialConfig);
  await initialDB.raw(`DELETE FROM ${Table.artistProfiles}`);
  await initialDB.raw(`DELETE FROM ${Table.artists}`);
  await initialDB.raw(`DELETE FROM ${Table.nfts_processedTracks}`);
  await initialDB.raw(`DELETE FROM ${Table.processedTracks}`);
  await initialDB.raw(`DELETE FROM ${Table.nftProcessErrors}`);
  for (const apiPlatform of apiPlatforms) {
    await initialDB.raw(`DELETE FROM ${Table.processors} where id='createProcessedTracksFromAPI_${apiPlatform}'`);
  }
  console.log('Done');
}

start();
