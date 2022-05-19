import { ArtistProfile } from './artist';
import { ERC721NFT } from './erc721nft';
import catalogMappers from './platforms/catalog';
import noizdMappers from './platforms/noizd';
import soundMappers from './platforms/sound';
import { ProcessedTrack } from './track';

export enum MusicPlatformType {
  sound = 'sound',
  noizd = 'noizd',
  catalog = 'catalog',
  zora = 'zora',
}

export type MusicPlatform = {
  id: string,
  type: MusicPlatformType
}

export type PlatformMapper = {
  mapNFTsToTrackIds: (nfts:ERC721NFT[]) => { [trackId: string]:ERC721NFT[] }
  mapTrack: (nft: ERC721NFT, apiTrack: any) => ProcessedTrack
  mapArtistProfile: ({ apiTrack, nft }: { apiTrack: any, nft?: ERC721NFT }) => ArtistProfile
}

export type MusicPlatformTypeConfig = {
  mappers: PlatformMapper
  initialTrackCursor?: string
};

export type MusicPlatformTypeConfigs = {
  [key in MusicPlatformType]?: MusicPlatformTypeConfig
}

export const platformConfigs: MusicPlatformTypeConfigs = {
  sound: {
    mappers: soundMappers,
  },
  catalog: {
    mappers: catalogMappers,
  },
  noizd: {
    mappers: noizdMappers,
    initialTrackCursor: '2020-04-07T21:11:16.494Z'
  },
}
