import { isValidChecksumAddress } from 'ethereumjs-util';
import { Request } from 'express';

import { Table } from '../db/db';
import db from '../db/sql-db'
import { EthereumAddress } from '../types/ethereum';
import { CrdtOperation, getCrdtUpdateMessage, getCrdtUpsertMessage } from '../types/message'
import { NFTContractTypeName, NFTStandard } from '../types/nft';
import { MusicPlatformType } from '../types/platform';

export type AuthRequest = Request & {
  signer?: string;
}

enum CrdtEntities {
  'platforms',
  'nftFactories',
  'artists',
  'processedTracks'
}
type CrdtEntity = keyof typeof CrdtEntities;

type MessagePayload = {
  entity: CrdtEntity,
  operation: CrdtOperation,
  signer: EthereumAddress,
  data: any,
}

const crdtOperationMessageFnMap = {
  [CrdtOperation.UPSERT]: getCrdtUpsertMessage,
  [CrdtOperation.UPDATE]: getCrdtUpdateMessage,
  [CrdtOperation.CONTRACT_APPROVAL]: getCrdtUpdateMessage,
}

const PlatformValidKeys = ['id', 'name', 'type'];

const NFTFactoryValidUpdateKeys = ['id', 'autoApprove', 'approved'];
const NFTFactoryValidUpsertKeys = ['id', 'startingBlock', 'platformId', 'contractType', 'standard', 'typeMetadata', 'autoApprove', 'approved'];
const NFTFactoryMinUpsertKeys = NFTFactoryValidUpsertKeys.filter((key) => !['typeMetadata'].includes(key));

const ArtistValidKeys = ['id', 'name'];
const ProcessedTrackValidKeys = ['id', 'title', 'description', 'websiteUrl'];

export const validateMessage = (payload: MessagePayload): void => {
  entityValidator(payload);

  const validatorFunctions: any = {
    'platforms': {
      'upsert': [
        () => minimumKeysPresent(payload, PlatformValidKeys),
        () => onlyValidKeysPresent(payload, PlatformValidKeys),
        () => typeValidator(payload, 'type', MusicPlatformType),
      ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, PlatformValidKeys),
        () => typeValidatorOptional(payload, 'type', MusicPlatformType),
      ],
    },
    'nftFactories': {
      'upsert': [
        () => minimumKeysPresent(payload, NFTFactoryMinUpsertKeys),
        () => onlyValidKeysPresent(payload, NFTFactoryValidUpsertKeys),
        () => typeValidator(payload, 'contractType', NFTContractTypeName),
        () => typeValidator(payload, 'standard', NFTStandard),
      ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, NFTFactoryValidUpdateKeys),
      ],
    },
    'artists': {
      'upsert': [
        () => { throw new Error('Artist upsert not supported') },
      ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, ArtistValidKeys),
      ],
    },
    'processedTracks': {
      'upsert': [
        () => { throw new Error('Track upsert not supported') },
      ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, ProcessedTrackValidKeys),
      ],
    }
  }

  validatorFunctions[payload.entity][payload.operation].forEach((fn: any) => fn());
}

// Checks that every expected key is present in the input data
const minimumKeysPresent = (input: MessagePayload, keys: any): void => {
  if (!keys.every((key: any) => input.data.hasOwnProperty(key))) {
    throw new Error(`${input.entity} entity is missing required fields`)
  }
  const inputKeys = Object.keys(input.data);
  if (inputKeys.length <= 1) {
    throw new Error(`At least one non-id field is needed in the payload`);
  }
}

// Checks that every key in the input data is valid
const onlyValidKeysPresent = (input: MessagePayload, keys: any): void => {
  if (!Object.keys(input.data).every((key: any) => keys.includes(key))) {
    throw new Error(`${input.entity} entity has unsupported fields`)
  }
}

// Checks that the given key on the input data exists and is a valid type
const typeValidator = (input: MessagePayload, key: string, validOptions: any): void => {
  if (!Object.values(validOptions).includes(input.data[key])) {
    throw new Error(`not a valid ${input.entity} ${key}`)
  }
}

// Checks that the given key on the input data is a valid type, if it exists
const typeValidatorOptional = (input: MessagePayload, key: string, validOptions: any): void => {
  if (input.data[key]) {
    typeValidator(input, key, validOptions);
  }
}

const entityValidator = (input: MessagePayload): void => {
  if (!Object.values(CrdtEntities).includes(input.entity)) {
    throw new Error('unknown seed entity');
  }
  if (!Object.values(CrdtOperation).includes(input.operation)) {
    throw new Error('must specify either `upsert` or `update` operation');
  }
}

export const persistMessage = async (payload: MessagePayload, signer?: EthereumAddress) => {
  if (!signer) {
    throw new Error('must specify a signer');
  }

  const dbClient = await db.init();
  validateMessage(payload);

  const messageFn = crdtOperationMessageFnMap[payload.operation];
  if (!messageFn) {
    throw new Error('must specify either `upsert` or `update` operation');
  }

  const message = messageFn(Table[payload.entity], payload.data as any, signer);

  try {
    console.log(`Upserting ${JSON.stringify(message)}`)
    await dbClient.upsert(Table.seeds, [message])
  } catch (e: any) {
    console.error(e);
    throw new Error(e.message);
  } finally {
    await dbClient.close();
  }
}

export const onlyAdmin = (signer: string | undefined): void => {
  if ( !signer || !isValidChecksumAddress(signer) || !permittedAdminAddresses().includes(signer.toLowerCase())
  ) {
    throw `Invalid admin address: ${signer}`;
  }
}

const permittedAdminAddresses = (): string[] => {
  const addresses = process.env.PERMITTED_ADMIN_ADDRESSES?.toLowerCase();
  if (!addresses) {
    throw new Error('PERMITTED_ADMIN_ADDRESSES not set');
  }
  return addresses.split(',');
}
