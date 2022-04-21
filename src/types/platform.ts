import { ArtistProfile } from "./artist";
import catalogMappers from './platforms/catalog';
import soundMappers from './platforms/sound';
import noizdMappers from './platforms/noizd';
import { Track, ProcessedTrack } from "./track";

export enum MusicPlatform {
  sound = "sound",
  zora = "zora",
  noizd = "noizd",
  catalog = "catalog",
  zoraRaw = "zoraRaw",
  other = "other"
}

export const INITIAL_PLATFORM_ENUMS = [
  "sound",
  "zora",
  "noizd",
  "catalog",
  "zoraRaw",
  "other"
]

export type PlatformMapper = {
  addPlatformTrackData: (tracks: Track[], client: any) => Promise<{
    track: Track;
    platformTrackResponse: unknown;
  }[]>;
  mapTrack: (trackItem: {
    track: Track;
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
