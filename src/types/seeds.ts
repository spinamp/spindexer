
import { Table } from '../db/db';
import db from '../db/sql-db'

import { ArtistProfileKeys } from './artist';
import { getCrdtUpdateMessage, getCrdtUpsertMessage } from './message'
import { NFTContractTypeName, NFTFactoryKeys, NFTStandard } from './nft';
import { MusicPlatform, MusicPlatformKeys, MusicPlatformType } from './platform';
import { ProcessedTrackKeys } from './track';

enum SeedEntities {
  'platforms',
  'nftFactories',
  'artistProfiles',
  'processedTracks'
}
type SeedEntity = keyof typeof SeedEntities;

enum PlatformsRequiredKeys {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
}

enum NFTFactoriesRequiredKeys {
  ID = 'id',
  PLATFORM_ID = 'platformId',
  CONTRACT_TYPE = 'contractType', // validated against `NFTContractTypeName`
  STANDARD = 'standard', // validated against `NFTStandard`
  AUTO_APPROVE = 'autoApprove',
  APPROVED = 'approved'
}

enum ArtistProfilesRequiredKeys {
  ARTIST_ID = 'artistId',
  PLATFORM_ID = 'platformId',
}

enum ProcessedTracksRequiredKeys {
  ARTIST_ID = 'artistId',
  PLATFORM_ID = 'platformId',
}

type SeedPayload = {
  entity: SeedEntity,
  data: any
}

export const validateSeed = (payload: SeedPayload): void => {
  entityValidator(payload);

  const validatorFunctions = {
    'platforms': [
      () => minimumKeysPresent(payload, Object.values(PlatformsRequiredKeys)),
      () => onlyValidKeysPresent(payload, MusicPlatformKeys),
      () => typeValidator(payload, 'type', MusicPlatformType),
    ],
    'nftFactories': [
      () => minimumKeysPresent(payload, Object.values(NFTFactoriesRequiredKeys)),
      () => onlyValidKeysPresent(payload, NFTFactoryKeys),
      () => typeValidator(payload, 'contractType', NFTContractTypeName),
      () => typeValidator(payload, 'standard', NFTStandard),
    ],
    'artistProfiles': [
      () => minimumKeysPresent(payload, Object.values(ArtistProfilesRequiredKeys)),
      () => onlyValidKeysPresent(payload, ArtistProfileKeys),
    ],
    'processedTracks': [
      () => minimumKeysPresent(payload, Object.values(ProcessedTracksRequiredKeys)),
      () => onlyValidKeysPresent(payload, ProcessedTrackKeys),
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
