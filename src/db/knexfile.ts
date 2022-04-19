export default {
  development: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
    },
    migrations: {
      directory: __dirname + '/migrations',
    },
    useNullAsDefault: true,
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      ssl: true,
    },
    migrations: {
      directory: __dirname + '/migrations',
    },
    useNullAsDefault: true,
  },
};
