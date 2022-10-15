

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

const AllPlatformKeys = ['id', 'name', 'type'];

const AllNFTFactoryKeys = ['id', 'startingBlock', 'platformId', 'contractType', 'standard', 'typeMetadata', 'autoApprove', 'approved'];
const RequiredNFTFactoryKeys = AllNFTFactoryKeys.filter((key) => key !== 'typeMetadata');

const ArtistRequiredKeys = ['id'];
const ArtistValidKeys = ArtistRequiredKeys.concat('name');

const ProcessedTrackRequiredKeys = ['id'];
const ProcessedTrackValidKeys = ProcessedTrackRequiredKeys.concat('title', 'description', 'websiteUrl');

const crdtOperationMessageFnMap = {
  [CrdtOperation.UPSERT]: getCrdtUpsertMessage,
  [CrdtOperation.UPDATE]: getCrdtUpdateMessage,
}

export const validateSeed = (payload: SeedPayload): void => {
  entityValidator(payload);

  const validatorFunctions: any = {
    'platforms': {
      'upsert': [
        () => minimumKeysPresent(payload, AllPlatformKeys),
        () => onlyValidKeysPresent(payload, AllPlatformKeys),
        () => typeValidator(payload, 'type', MusicPlatformType),
      ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, AllPlatformKeys),
        () => typeValidatorOptional(payload, 'type', MusicPlatformType),
      ],
    },
    'nftFactories': {
      'upsert': [
        () => minimumKeysPresent(payload, RequiredNFTFactoryKeys),
        () => onlyValidKeysPresent(payload, AllNFTFactoryKeys),
        () => typeValidator(payload, 'contractType', NFTContractTypeName),
        () => typeValidator(payload, 'standard', NFTStandard),
      ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, AllNFTFactoryKeys),
        () => typeValidatorOptional(payload, 'contractType', NFTContractTypeName),
        () => typeValidatorOptional(payload, 'standard', NFTStandard),
      ],
    },
    'artists': {
      'upsert': [],
      'update': [
        () => minimumKeysPresent(payload, ArtistRequiredKeys),
        () => onlyValidKeysPresent(payload, ArtistValidKeys),
      ],
    },
    'processedTracks': {
      'upsert': [],
      'update': [
        () => minimumKeysPresent(payload, ProcessedTrackRequiredKeys),
        () => onlyValidKeysPresent(payload, ProcessedTrackValidKeys),
      ],
    }
  }

  validatorFunctions[payload.entity][payload.operation].forEach((fn: any) => fn());
}

const minimumKeysPresent = (input: SeedPayload, keys: any): void => {
  if (!keys.every((key: any) => input.data.hasOwnProperty(key))) {
    throw new Error(`${input.entity} entity is missing required fields`)
  }
}

const onlyValidKeysPresent = (input: SeedPayload, keys: any): void => {
  if (!Object.keys(input.data).every((key: any) => keys.includes(key))) {
    throw new Error(`${input.entity} entity has unsupported fields`)
  }
}

const typeValidator = (input: SeedPayload, key: string, validOptions: any): void => {
  if (!Object.values(validOptions).includes(input.data[key])) {
    throw new Error(`not a valid ${input.entity} ${key}`)
  }
}

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
  let dbClient: any;
  entityValidator(payload);

  const messageFn = crdtOperationMessageFnMap[payload.operation];
  if (!messageFn) {
    throw new Error('must specify either `upsert` or `update` operation');
  }

  const message = messageFn(Table[payload.entity], payload.data as any)

  try {
    dbClient = await db.init();
    await dbClient.upsert(Table.seeds, [message])
  } catch (e: any) {
    console.error(e);
    throw new Error(e.message);
  } finally {
    dbClient.close();
  }
}
