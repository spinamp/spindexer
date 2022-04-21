import 'dotenv/config';
import './types/env';
import http from 'http';

import postgraphile from 'postgraphile';

const DATABASE_URL = `postgresql://${process.env.POSTGRES_USERNAME_OPEN}:${process.env.POSTGRES_PASSWORD_OPEN}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}${process.env.NODE_ENV === 'production'? '?ssl=true' : ''}`;

const ownerConnectionString = `postgresql://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}${process.env.NODE_ENV === 'production'? '?ssl=true' : ''}`;

http
  .createServer(
    postgraphile(
      DATABASE_URL,
      'public',
      {
        ownerConnectionString,
        appendPlugins: [require('postgraphile-plugin-connection-filter')],
        watchPg: false,
        graphiql: true,
        enhanceGraphiql: true,
        dynamicJson: true,
        disableDefaultMutations: true,
        pgDefaultRole: 'open_access',
        enableCors: true,
      }
    )
  )
  .listen(process.env.PORT || 3000);

console.log(`Listening on ${process.env.PORT || 3000}`)
