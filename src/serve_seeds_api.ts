import 'dotenv/config';
import './types/env';
import cors from 'cors';
import express from 'express';

import { authMiddleware, persistSeed, validateSeed } from './utils/seedsApi';

const apiVersionPrefix = '/v1';

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));
app.use(authMiddleware);

app.post(`${apiVersionPrefix}/seeds/`, async (req, res) => {
  try {
    validateSeed(req.body)
  } catch (e: any) {
    return res.status(422).send({ error: e.message });
  }

  try {
    await persistSeed(req.body)
    res.sendStatus(200);
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(3005, () => {
    console.log(`Server running on port ${3005}`);
  });
}

module.exports = app;
