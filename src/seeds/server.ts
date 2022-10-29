import '../types/env';
import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import { authMiddleware } from './middleware';
import { AuthRequest, persistSeed, validateSeed } from './types';

const apiVersionPrefix = `/v${process.env.SEEDS_API_VERSION || '1'}`;

export const createSeedsAPIServer = () => {
  const app = express();
  app.use(cors({
    'origin': true,
    'exposedHeaders': ['x-signature'],
    'methods': ['POST'],
  }))
  app.use(express.json());
  app.use(authMiddleware);

  app.post(`${apiVersionPrefix}/seeds/`, async (req: AuthRequest, res) => {
    try {
      validateSeed(req.body)
    } catch (e: any) {
      return res.status(422).send({ error: e.message });
    }

    try {
      await persistSeed(req.body, req.signer)
      res.sendStatus(200);
    } catch (e: any) {
      console.log(e);
      res.status(500).send({ error: e.message });
    }
  });

  return app;
}
