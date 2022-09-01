import 'dotenv/config';
import '../src/types/env';

import config from '../src/db/knexfile';
import { createDB } from '../src/db/sql-db';

const start = async () => {
  const currentConfig = config[process.env.NODE_ENV]
  console.log('Creating...');
  await createDB(currentConfig);
  console.log('Done');
  process.exit(0);
}

start();
