import 'dotenv/config';
import './types/env';
import express from 'express';

import { Table } from './db/db';
import db from './db/sql-db'
import { getCrdtUpdateMessage } from './types/message';
import { MusicPlatform } from './types/platform';

const apiVersionPrefix = '/v1';

const app = express();
const dbClient = async () => {
  return db.init();
}

app.use(express.json());
// app.use(authMiddleware); // TODO custom authentication

app.post(`${apiVersionPrefix}/seeds/platforms/`, async (req, res) => {
  try {
    // TODO: validate that data conforms to MusicPlatform type structure
    const message = getCrdtUpdateMessage<MusicPlatform>(Table.platforms, req.body)

    const myDB = await dbClient();
    await myDB.upsert(Table.seeds, [message])

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});
app.post(`${apiVersionPrefix}/seeds/tracks/`, async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});
app.post(`${apiVersionPrefix}/seeds/contracts/`, async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});
app.post(`${apiVersionPrefix}/seeds/artists/`, async (req, res) => {
  try {
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.listen(3005, () => {
  console.log(`Server running on port ${3005}`);
});

