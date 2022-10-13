import { Table } from '../db/db';
import db from '../db/sql-db'
import { getCrdtUpdateMessage, getCrdtUpsertMessage } from '../types/message'
import { NFTContractTypeName, NFTStandard } from '../types/nft';
import { MusicPlatformType } from '../types/platform';

enum SeedEntities {
  'platforms',
  'nftFactories',
  'artists',
  'processedTracks'
}
type SeedEntity = keyof typeof SeedEntities;

const PlatformRequiredKeys = ['id', 'name', 'type'];
const PlatformValidKeys = PlatformRequiredKeys;

const NFTFactoryRequiredKeys = ['id', 'startingBlock', 'platformId', 'contractType', 'name', 'symbol', 'typeMetadata', 'standard', 'autoApprove', 'approved'];
const NFTFactoryValidKeys = NFTFactoryRequiredKeys;

const ArtistRequiredKeys = ['id'];
const ArtistValidKeys = ['id', 'name'];

const ProcessedTrackRequiredKeys = ['id'];
const ProcessedTrackValidKeys = ['id', 'title', 'slug', 'description', 'websiteUrl', 'lossyAudioURL', 'lossyAudioIPFSHash', 'lossyArtworkURL', 'lossyArtworkIPFSHash'];

type SeedPayload = {
  entity: SeedEntity,
  data: any
}

export const validateSeed = (payload: SeedPayload): void => {
  entityValidator(payload);

  const validatorFunctions = {
    'platforms': [
      () => minimumKeysPresent(payload, PlatformRequiredKeys),
      () => onlyValidKeysPresent(payload, PlatformValidKeys),
      () => typeValidator(payload, 'type', MusicPlatformType),
    ],
    'nftFactories': [
      () => minimumKeysPresent(payload, NFTFactoryRequiredKeys),
      () => onlyValidKeysPresent(payload, NFTFactoryValidKeys),
      () => typeValidator(payload, 'contractType', NFTContractTypeName),
      () => typeValidator(payload, 'standard', NFTStandard),
    ],
    'artists': [
      () => minimumKeysPresent(payload, ArtistRequiredKeys),
      () => onlyValidKeysPresent(payload, ArtistValidKeys),
    ],
    'processedTracks': [
      () => minimumKeysPresent(payload, ProcessedTrackRequiredKeys),
      () => onlyValidKeysPresent(payload, ProcessedTrackValidKeys),
    ],
  }

  validatorFunctions[payload.entity].forEach((fn) => fn());
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

const entityValidator = (input: SeedPayload): void => {
  if (!Object.values(SeedEntities).includes(input.entity)) {
    throw new Error('unknown seed entity');
  }
}

export const persistSeed = async (payload: SeedPayload) => {
  let message: any;
  let dbClient: any;

  entityValidator(payload);

  if (['platforms', 'nftFactories'].includes(payload.entity)) {
    message = getCrdtUpsertMessage(Table[payload.entity], payload.data as any)
  } else if (['processedTracks', 'artists'].includes(payload.entity)) {
    message = getCrdtUpdateMessage(Table[payload.entity], payload.data as any)
  } else {
    throw new Error(`message not defined for entity: '${payload.entity}'`);
  }

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
