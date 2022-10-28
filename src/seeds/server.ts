import '../types/env';
import 'dotenv/config';
import express from 'express';

import { authMiddleware } from './middleware';
import { persistSeed, validateSeed } from './types';

const apiVersionPrefix = `/v${process.env.SEEDS_API_VERSION || '1'}`;

export const createSeedsAPIServer = () => {
  const app = express();
  app.use(express.json());
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
      console.log(e);
      res.status(500).send({ error: e.message });
    }
  });

  return app;
}
