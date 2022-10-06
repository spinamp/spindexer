import { isValidChecksumAddress } from 'ethereumjs-util'
import { Request, Response, NextFunction } from 'express'
import _ from 'lodash'
import Web3 from 'web3';

import { Table } from '../db/db';
import db from '../db/sql-db'
import { getCrdtUpdateMessage } from '../types/message'
import { NFTContractTypeName, NftFactory, NFTStandard } from '../types/nft';
import { MusicPlatform, MusicPlatformType } from '../types/platform';

type SeedEntity = 'platform' | 'contract'

enum SeedPlatformRequiredKeys {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
}

enum SeedNftFactoryRequiredKeys {
  ID = 'id',
  // startingBlock?: string, // ignore optional
  PLATFORM_ID = 'platformId',
  CONTRACT_TYPE = 'contractType', // validated against `NFTContractTypeName`
  // name?: string, // ignore optional
  // symbol?: string, // ignore optional
  // typeMetadata?: TypeMetadata // ignore optional
  STANDARD = 'standard', // validated against `NFTStandard`
  AUTO_APPROVE = 'autoApprove',
  APPROVED = 'approved'
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


export const validateSeed = (payload: SeedPayload) => {
  if (payload.entity === 'platform') {
    if (!minimumKeysPresent(payload.data, SeedPlatformRequiredKeys)) {
      throw new Error('platform entity is missing required fields')
    }
    if (!validForType(payload.data.type, MusicPlatformType)) {
      throw new Error('not a valid platform type')
    }
  } else if (payload.entity === 'contract') {
    if (!minimumKeysPresent(payload.data, SeedNftFactoryRequiredKeys)) {
      throw new Error('contract entity is missing required fields')
    }
    if (!validForType(payload.data.contractType, NFTContractTypeName)) {
      throw new Error('not a valid contract type')
    }
    if (!validForType(payload.data.standard, NFTStandard)) {
      throw new Error('not a valid contract standard')
    }
  } else {
    throw new Error('unknown seed entity');
  }
  return payload;
}

export const persistSeed = async (payload: SeedPayload) => {
  const dbClient = await db.init();
  let message: any;
  try {
    if (payload.entity === 'platform') {
      message = getCrdtUpdateMessage<MusicPlatform>(Table.platforms, payload as any)
    } else if (payload.entity === 'contract') {
      message = getCrdtUpdateMessage<NftFactory>(Table.nftFactories, payload as any)
    }
    await dbClient.upsert(Table.seeds, [message])
  } finally {
    dbClient.close();
  }
}

const minimumKeysPresent = (input: any, requiredKeys: any) => {
  return _.difference(Object.keys(input), Object.values(requiredKeys)).length === 0;
}

const validForType = (input: any, type: any) => {
  return Object.values(type).includes(input)
}
