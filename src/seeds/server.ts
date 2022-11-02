import '../types/env';
import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import { restrictAccess } from './access';
import { authMiddleware } from './middleware';
import { persistMessage } from './persistence';
import { AuthRequest } from './types';
import { validateMessage } from './validation';

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

  app.post(`${apiVersionPrefix}/messages/`, async (req: AuthRequest, res) => {
    try {
      validateMessage(req.body)
    } catch (e: any) {
      return res.status(422).send({ error: e.message });
    }

    try {
      restrictAccess(req.body, req.signer);
    } catch (e: any) {
      console.log(e);
      res.status(403).send({ error: 'Authentication failed' });
      return;
    }

    try {
      await persistMessage(req.body, req.signer)
      res.sendStatus(200);
    } catch (e: any) {
      console.log(e);
      res.status(500).send({ error: e.message });
    }
  });

  return app;
}
