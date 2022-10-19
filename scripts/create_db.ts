import 'dotenv/config';
import '../src/types/env';

import config from '../src/db/knexfile';
import { createDB } from '../src/db/sql-db';

const start = async () => {
  const currentEnv = process.env.NODE_ENV;
  const currentConfig = config[currentEnv]
  console.log(`Creating ${currentEnv} environment database: '${currentConfig.connection.database}'...`);
  await createDB(currentConfig);
  console.log('Done');
  process.exit(0);
}

start();
