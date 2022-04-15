export default {
  development: {
    client: 'sqlite3',
    connection: { filename: "./localdb/local.sqlite" },
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
    },
    migrations: {
      directory: __dirname + '/migrations',
    },
    useNullAsDefault: true,
  },
};
