import db from '../../src/db/sql-db';
import { ZORA_LATEST_PLATFORM } from '../constants/artistIntegrations';
import { Table } from '../db/db';
import { NFTContractTypeName, NftFactory, NFTStandard } from '../types/nft';
import { MusicPlatformType } from '../types/platform';

import { AllApiOperations, CrdtEntities, MessagePayload } from './types';


const PlatformValidKeys = ['id', 'name', 'type'];

const NFTFactoryValidUpdateKeys = ['id', 'autoApprove', 'approved'];
const NFTFactoryValidUpsertKeys = ['id', 'startingBlock', 'platformId', 'contractType', 'standard', 'typeMetadata', 'autoApprove', 'approved'];
const NFTFactoryMinUpsertKeys = NFTFactoryValidUpsertKeys.filter((key) => !['typeMetadata'].includes(key));

const ArtistValidKeys = ['id', 'name'];
const ProcessedTrackValidKeys = ['id', 'title', 'description', 'websiteUrl'];

export const validateMessage = async (payload: MessagePayload) => {
  payloadValidator(payload);

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
      'contractApproval': [ () => { throw new Error('Platform approval not supported') } ],
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
      'contractApproval': [
        () => minimumKeysPresent(payload, NFTFactoryValidUpdateKeys),
        () => onlyValidKeysPresent(payload, NFTFactoryValidUpdateKeys),
        () => onlyZoraContract(payload),
      ],
    },
    'artists': {
      'upsert': [ () => { throw new Error('Artist upsert not supported') } ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, ArtistValidKeys),
      ],
      'contractApproval': [ () => { throw new Error('Artist approval not supported') } ],
    },
    'processedTracks': {
      'upsert': [ () => { throw new Error('Track upsert not supported') } ],
      'update': [
        () => minimumKeysPresent(payload, ['id']),
        () => onlyValidKeysPresent(payload, ProcessedTrackValidKeys),
      ],
      'contractApproval': [ () => { throw new Error('Track approval not supported') } ],
    }
  }

  validatorFunctions[payload.entity][payload.operation].forEach( (fn: any) => fn());
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

const payloadValidator = (input: MessagePayload): void => {
  if (!Object.values(CrdtEntities).includes(input.entity)) {
    throw new Error('unknown seed entity');
  }
  if (!Object.values(AllApiOperations).includes(input.operation)) {
    throw new Error('must specify either `upsert`, `update`, or `contractApproval` operation');
  }
}

const onlyZoraContract = async (input: MessagePayload): Promise<void> => {
  console.log('-------------------ZORA CHECK START ----------------');
  const contractId = input.data.id;

  const dbClient = await db.init();

  // TODO: adjust to also query for platform type
  const persistedContract: any = await dbClient.getRecords<NftFactory>(Table.nftFactories, [['where', [ 'id', contractId ]]])

  console.log(persistedContract[0].platformId);
  if (persistedContract[0]?.platformId === ZORA_LATEST_PLATFORM.id) {
    console.log('ALL GOOD, RETURNING');
    return;
  }
  console.log('---------> GONNA THROW UP (but not being caught because async handling is wrong)');
  throw new Error('not a valid zora contract');
}
