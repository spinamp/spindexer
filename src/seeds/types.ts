import { Table } from '../db/db';
import db from '../db/sql-db'
import { getCrdtUpdateMessage, getCrdtUpsertMessage } from '../types/message'
import { NFTContractTypeName, NFTStandard } from '../types/nft';
import { MusicPlatformType } from '../types/platform';

enum SeedEntities {
  'platforms',
  'nftFactories',
  'artistProfiles',
  'artists',
  'processedTracks'
}
type SeedEntity = keyof typeof SeedEntities;

enum PlatformsRequiredKeys {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
}
const PlatformKeys = ['id', 'type', 'name'];

enum NFTFactoriesRequiredKeys {
  ID = 'id',
  PLATFORM_ID = 'platformId',
  CONTRACT_TYPE = 'contractType',
  STANDARD = 'standard',
  AUTO_APPROVE = 'autoApprove',
  APPROVED = 'approved'
}
const NFTFactoryKeys = ['id', 'platformId', 'contractType', 'name', 'symbol', 'typeMetadata', 'standard', 'autoApprove', 'approved'];

enum ArtistProfilesRequiredKeys {
  ARTIST_ID = 'artistId',
  PLATFORM_ID = 'platformId',
}
const ArtistProfileKeys = ['platformInternalId', 'artistId', 'name', 'platformId', 'avatarUrl', 'websiteUrl'];

enum ArtistsRequiredKeys {
  ID = 'id',
  NAME = 'name',
}
const ArtistKeys = ['id', 'name'];

enum ProcessedTracksRequiredKeys {
  ARTIST_ID = 'artistId',
  PLATFORM_ID = 'platformId',
}
const ProcessedTrackKeys = ['platformInternalId', 'title', 'slug', 'platformId', 'description', 'websiteUrl', 'artistId', 'lossyAudioURL', 'lossyAudioIPFSHash', 'lossyArtworkURL', 'lossyArtworkIPFSHash'];

type SeedPayload = {
  entity: SeedEntity,
  data: any
}

export const validateSeed = (payload: SeedPayload): void => {
  entityValidator(payload);

  const validatorFunctions = {
    'platforms': [
      () => minimumKeysPresent(payload, Object.values(PlatformsRequiredKeys)),
      () => onlyValidKeysPresent(payload, PlatformKeys),
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
    'artists': [
      () => minimumKeysPresent(payload, Object.values(ArtistsRequiredKeys)),
      () => onlyValidKeysPresent(payload, ArtistKeys),
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
    message = getCrdtUpsertMessage(Table[payload.entity], payload.data as any)
  } else if (['artistProfiles', 'processedTracks', 'artists'].includes(payload.entity)) {
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
