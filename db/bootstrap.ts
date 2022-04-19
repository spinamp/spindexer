import 'dotenv/config';
import '../src/types/env';
import knex from 'knex';
import config from '../src/db/knexfile';

const bootstrapDB = async () => {
  const currentConfig = config[process.env.NODE_ENV]
    const initialConfig = { ...currentConfig,
      connection: {
        ...currentConfig.connection,
        database: 'postgres',
        user: process.env.DB_SUPERUSER,
        password: process.env.DB_SUPERUSER_PASSWORD,
        ssl: process.env.NODE_ENV === 'production'
      }
    };
    const initialDB = knex(initialConfig);
    await initialDB.raw(`CREATE ROLE ${process.env.POSTGRES_USERNAME} LOGIN PASSWORD '${process.env.POSTGRES_PASSWORD}';`);
    await initialDB.raw(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${process.env.POSTGRES_USERNAME};`);
    await initialDB.raw(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${process.env.POSTGRES_USERNAME};`);
    await initialDB.raw(`GRANT ALL PRIVILEGES ON DATABASE postgres TO ${process.env.POSTGRES_USERNAME};`);
    await initialDB.raw(`ALTER USER ${process.env.POSTGRES_USERNAME} CREATEDB;`);
    await initialDB.raw(`CREATE ROLE ${process.env.POSTGRES_USERNAME_OPEN} LOGIN PASSWORD '${process.env.POSTGRES_PASSWORD_OPEN}';`);
    await initialDB.destroy();
}

bootstrapDB();
