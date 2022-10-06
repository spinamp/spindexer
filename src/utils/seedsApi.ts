import { isValidChecksumAddress } from 'ethereumjs-util'
import { Request, Response, NextFunction } from 'express'
import _ from 'lodash'
import Web3 from 'web3';

import { Table } from '../db/db';
import db from '../db/sql-db'
import { getCrdtUpdateMessage } from '../types/message'
import { MusicPlatform, MusicPlatformType } from '../types/platform';

type SeedEntity = 'platform' | 'contract'

type SeedPlatform = {
  id: string,
  name: string,
  type: MusicPlatformType
}

enum SeedPlatformKeys {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
}

type SeedContract = {
  id: string,
}

type SeedPayload = {
  entity: SeedEntity,
  data: any
}

export const authMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {

  try {
    let signer: any;

    const auth = {
      message: JSON.stringify(request.body),
      signature: request.header('x-signature') || '',
    }

    try {
      signer = validateSignature(auth, permittedAdminAddresses());
    } catch (e) {
      throw e;
    }

    next();
  } catch (e) {
    response.status(403).send('Authentication failed');
    return;
  }
};

export function validateSignature(signatureData: {
  message: string;
  signature: string;
}, permittedAddresses: string[]): string {
  let signer: string;

  try {
    const web3 = new Web3();
    signer = web3.eth.accounts.recover(
      signatureData.message,
      signatureData.signature,
    );
  } catch (e) {
    throw `Error verifying signature: ${e}`;
  }

  if (
    !isValidChecksumAddress(signer) ||
    !permittedAddresses.includes(signer.toLowerCase())
  ) {
    throw `Invalid signer address: ${signer}`;
  }

  return signer;
}

const permittedAdminAddresses = (): string[] => {
  const addresses = process.env.PERMITTED_ADMIN_ADDRESSES?.toLowerCase();
  if (!addresses) {
    throw new Error('PERMITTED_ADMIN_ADDRESSES not set');
  }
  return addresses.split(',');
}


export const parseSeed = (payload: SeedPayload) => {
  const parsed = payload;

  if (payload.entity === 'platform') {
    if (!_.isEqual(Object.keys(parsed.data), Object.values(SeedPlatformKeys))) {
      throw new Error('missing platform entity required fields')
    }
    if (!Object.values(MusicPlatformType).includes(parsed.data.type)) {
      throw new Error('not a valid platform type')
    }
  } else if (payload.entity === 'contract') {
  } else {
    throw new Error('unknown seed entity');
  }
  return parsed;
}

export const persistSeed = async (payload: any) => {
  const dbClient = await db.init();
  try {
    const message = getCrdtUpdateMessage<MusicPlatform>(Table.platforms, payload)
    await dbClient.upsert(Table.seeds, [message])
  } finally {
    dbClient.close();
  }
}
