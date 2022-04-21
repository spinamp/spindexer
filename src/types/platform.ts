import { ArtistProfile } from './artist';
import { Metadata } from './metadata';
import catalogMappers from './platforms/catalog';
import noizdMappers from './platforms/noizd';
import soundMappers from './platforms/sound';
import { ProcessedTrack } from './track';

export enum MusicPlatform {
  sound = 'sound',
  zora = 'zora',
  noizd = 'noizd',
  catalog = 'catalog',
  zoraRaw = 'zoraRaw',
  other = 'other'
}

export const INITIAL_PLATFORM_ENUMS = [
  'sound',
  'zora',
  'noizd',
  'catalog',
  'zoraRaw',
  'other'
]

export type PlatformMapper = {
  addPlatformTrackData: (metadatas: Metadata[], client: any) => Promise<{
    metadata: Metadata;
    platformTrackResponse: unknown;
  }[]>;
  mapTrack: (item: {
    metadata: Metadata;
    platformTrackResponse: unknown;
  }) => ProcessedTrack;
  mapAPITrack?: (trackItem: unknown) => ProcessedTrack;
  mapAPITrackTime?: (trackItem: unknown) => Date;
  mapArtistProfile: (artistItem: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string) => ArtistProfile;
}

export type PlatformConfigItem = {
  mappers?: PlatformMapper
  initialTrackCursor?: string
};

export type PlatformConfig = {
  [key in MusicPlatform]: PlatformConfigItem
}

export const platformConfig: PlatformConfig = {
  sound: {
    mappers: soundMappers,
  },
  zora: {
  },
  catalog: {
    mappers: catalogMappers,
  },
  zoraRaw: {
  },
  noizd: {
    mappers: noizdMappers,
    initialTrackCursor: '2020-04-07T21:11:16.494Z'
  },
  other: {
  }
}
