import 'dotenv/config';
import './types/env';
import cors from 'cors';
import express from 'express';

import { Table } from './db/db';
import { getCrdtUpdateMessage } from './types/message';
import { MusicPlatform, MusicPlatformType } from './types/platform';
import { authMiddleware, connectDB } from './utils/seedsApi';

const apiVersionPrefix = '/v1';

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));
app.use(authMiddleware);

app.post(`${apiVersionPrefix}/seeds/platforms/`, async (req, res) => {
  const dbClient = await connectDB();

  try {
    const payload = req.body

    try {
      const parsed = JSON.parse(payload);
      if (!parsed.id || !parsed.name || !parsed.type) {
        throw new Error('missing music platform fields')
      }
      if (!Object.values(MusicPlatformType).includes(parsed.type)) {
        throw new Error('not a valid platform type')
      }
    } catch (e) {
      return res.sendStatus(422);
    }

    const message = getCrdtUpdateMessage<MusicPlatform>(Table.platforms, payload)
    await dbClient.upsert(Table.seeds, [message])

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(3005, () => {
    console.log(`Server running on port ${3005}`);
  });
}

module.exports = app;
