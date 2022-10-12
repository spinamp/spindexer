import { isValidChecksumAddress } from 'ethereumjs-util'
import { Request, Response, NextFunction } from 'express'
import Web3 from 'web3';

import { Table } from '../db/db';
import db from '../db/sql-db'
import { ArtistProfileKeys } from '../types/artist';
import { getCrdtUpdateMessage, getCrdtUpsertMessage } from '../types/message'
import { NFTContractTypeName, NFTFactoryKeys, NFTStandard } from '../types/nft';
import { MusicPlatform, MusicPlatformKeys, MusicPlatformType } from '../types/platform';
import { ProcessedTrackKeys } from '../types/track';

enum SeedEntities {
  'platforms',
  'nftFactories',
  'artistProfiles',
  'processedTracks'
}

type SeedEntity = keyof typeof SeedEntities;

enum SeedPlatformRequiredKeys {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
}

enum SeedNFTFactoryRequiredKeys {
  ID = 'id',
  PLATFORM_ID = 'platformId',
  CONTRACT_TYPE = 'contractType', // validated against `NFTContractTypeName`
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

  if (payload.entity === 'platforms') {
    minimumKeysPresent(payload, Object.values(SeedPlatformRequiredKeys));
    onlyValidKeysPresent(payload, MusicPlatformKeys);
    typeValidator(payload, 'type', MusicPlatformType);

  } else if (payload.entity === 'nftFactories') {
    minimumKeysPresent(payload, Object.values(SeedNFTFactoryRequiredKeys));
    onlyValidKeysPresent(payload, NFTFactoryKeys);
    typeValidator(payload, 'contractType', NFTContractTypeName);
    typeValidator(payload, 'standard', NFTStandard);

  } else if (payload.entity === 'artistProfiles') {
    minimumKeysPresent(payload, ['artistId', 'platformId']);
    onlyValidKeysPresent(payload, ArtistProfileKeys);

  } else if (payload.entity === 'processedTracks') {
    minimumKeysPresent(payload, ['artistId', 'platformId']);
    onlyValidKeysPresent(payload, ProcessedTrackKeys);
  } else {
    throw new Error('unknown seed entity');
  }

  return payload;
}

const minimumKeysPresent = (input: any, keys: any): void => {
  if (!containsAllKeys(input.data, keys)) {
    throw new Error(`${input.entity} entity is missing required fields`)
  }
}

const onlyValidKeysPresent = (input: any, keys: any): void => {
  if (!containsNoExtraKeys(input.data, keys)) {
    throw new Error(`${input.entity} entity has unsupported fields`)
  }
}

const typeValidator = (input: any, key: string, validOptions: any): void => {
  if (!validForType(input.data[key], validOptions)) {
    throw new Error(`not a valid ${input.entity} ${key}`)
  }
}

export const persistSeed = async (payload: SeedPayload) => {
  let message: any;
  let dbClient: any;

  if (!Object.values(SeedEntities).includes(payload.entity)) {
    throw new Error('unknown seed entity');
  }

  if (['platforms', 'nftFactories'].includes(payload.entity)) {
    message = getCrdtUpsertMessage<MusicPlatform>(Table[payload.entity], payload.data as any)
  } else if (['artistProfiles', 'processedTracks'].includes(payload.entity)) {
    message = getCrdtUpdateMessage<MusicPlatform>(Table[payload.entity], payload.data as any)
  }

  try {
    dbClient = await db.init();
    await dbClient.upsert(Table.seeds, [message])
  } finally {
    dbClient.close();
  }
}

const containsAllKeys = (input: any, keys: any): boolean => {
  return keys.every((key: any) => input.hasOwnProperty(key))
}

const containsNoExtraKeys = (input: any, keys: any): boolean => {
  return Object.keys(input).every((key: any) => keys.includes(key))
}

const validForType = (input: any, type: any): boolean => {
  return Object.values(type).includes(input)
}
