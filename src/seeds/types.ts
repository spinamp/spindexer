

import { Table } from '../db/db';
import db from '../db/sql-db'
import { CrdtOperation, getCrdtUpdateMessage, getCrdtUpsertMessage } from '../types/message'
import { NFTContractTypeName, NFTStandard } from '../types/nft';
import { MusicPlatformType } from '../types/platform';

enum SeedEntities {
  'platforms',
  'nftFactories',
  'artists',
  'processedTracks'
}
type SeedEntity = keyof typeof SeedEntities;

type SeedPayload = {
  entity: SeedEntity,
  operation: CrdtOperation,
  data: any,
}

const crdtOperationMessageFnMap = {
  [CrdtOperation.UPSERT]: getCrdtUpsertMessage,
  [CrdtOperation.UPDATE]: getCrdtUpdateMessage,
}

const PlatformValidKeys = ['id', 'name', 'type'];

const NFTFactoryValidUpdateKeys = ['id', 'autoApprove', 'approved'];
const NFTFactoryValidUpsertKeys = ['id', 'startingBlock', 'platformId', 'contractType', 'standard', 'typeMetadata', 'autoApprove', 'approved'];
const NFTFactoryMinUpsertKeys = NFTFactoryValidUpsertKeys.filter((key) => !['typeMetadata'].includes(key));

const ArtistValidKeys = ['id', 'name'];
const ProcessedTrackValidKeys = ['id', 'title', 'description', 'websiteUrl'];

export const validateSeed = (payload: SeedPayload): void => {
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
const minimumKeysPresent = (input: SeedPayload, keys: any): void => {
  if (!keys.every((key: any) => input.data.hasOwnProperty(key))) {
    throw new Error(`${input.entity} entity is missing required fields`)
  }
  const inputKeys = Object.keys(input.data);
  if (inputKeys.length <= 1) {
    throw new Error(`At least one non-id field is needed in the payload`);
  }
}

// Checks that every key in the input data is valid
const onlyValidKeysPresent = (input: SeedPayload, keys: any): void => {
  if (!Object.keys(input.data).every((key: any) => keys.includes(key))) {
    throw new Error(`${input.entity} entity has unsupported fields`)
  }
}

// Checks that the given key on the input data exists and is a valid type
const typeValidator = (input: SeedPayload, key: string, validOptions: any): void => {
  if (!Object.values(validOptions).includes(input.data[key])) {
    throw new Error(`not a valid ${input.entity} ${key}`)
  }
}

// Checks that the given key on the input data is a valid type, if it exists
const typeValidatorOptional = (input: SeedPayload, key: string, validOptions: any): void => {
  if (input.data[key]) {
    typeValidator(input, key, validOptions);
  }
}

const entityValidator = (input: SeedPayload): void => {
  if (!Object.values(SeedEntities).includes(input.entity)) {
    throw new Error('unknown seed entity');
  }
  if (!Object.values(CrdtOperation).includes(input.operation)) {
    throw new Error('must specify either `upsert` or `update` operation');
  }
}

export const persistSeed = async (payload: SeedPayload) => {
  const dbClient = await db.init();
  validateSeed(payload);

  const messageFn = crdtOperationMessageFnMap[payload.operation];
  if (!messageFn) {
    throw new Error('must specify either `upsert` or `update` operation');
  }

  const message = messageFn(Table[payload.entity], payload.data as any)

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
