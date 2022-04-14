export default {
  development: {
    client: 'sqlite3',
    connection: { filename: "./localdb/local.sqlite" },
    migrations: {
      directory: __dirname + '/migrations',
    },
    useNullAsDefault: true,
  },
};
