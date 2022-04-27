import { ArtistProfile } from './artist';
import { ERC721NFT } from './erc721nft';
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

export type PlatformMapper = {
  mapNFTsToTrackIds: (nfts:ERC721NFT[]) => { [trackId: string]:ERC721NFT[] }
  mapTrack: (nft: ERC721NFT, apiTrack: any) => ProcessedTrack
  mapArtistProfile: (apiTrack: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string) => ArtistProfile
  mapAPITrack?: (apiTrack: any) => ProcessedTrack
  mapAPITrackTime?: (apiTrack: any) => Date
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
