import 'dotenv/config';
import './types/env';
import express from 'express';

import { Table } from './db/db';
import db from './db/sql-db'
import { getCrdtUpdateMessage } from './types/message';
import { MusicPlatform } from './types/platform';

const apiVersionPrefix = '/v1';

const app = express();
const connectDB = async () => {
  return db.init();
}

app.use(express.json());
// app.use(cors({ origin: true }));

// app.use(authMiddleware); // TODO custom authentication

app.post(`${apiVersionPrefix}/seeds/platforms/`, async (req, res) => {
  const dbClient = await connectDB();

  try {
    // TODO: validate that data conforms to MusicPlatform type structure
    const message = getCrdtUpdateMessage<MusicPlatform>(Table.platforms, req.body)
    await dbClient.upsert(Table.seeds, [message])

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  } finally {
    dbClient.close()
  }
});

app.post(`${apiVersionPrefix}/seeds/tracks/`, async (req, res) => {
  const dbClient = await connectDB();
  try {
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  } finally {
    dbClient.close()
  }
});

app.post(`${apiVersionPrefix}/seeds/contracts/`, async (req, res) => {
  const dbClient = await connectDB();
  try {
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  } finally {
    dbClient.close()
  }
});

app.post(`${apiVersionPrefix}/seeds/artists/`, async (req, res) => {
  const dbClient = await connectDB();
  try {
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  } finally {
    dbClient.close()
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(3005, () => {
    console.log(`Server running on port ${3005}`);
  });
}

module.exports = app;
