import { ArtistProfile } from './artist';
import { ERC721NFT } from './erc721nft';
import { ERC721Contract } from './ethereum';
import catalogMappers from './platforms-types/catalog';
import noizdMappers from './platforms-types/noizd';
import singleTrackMultiprintContract from './platforms-types/single-track-multiprint-contract';
import soundMappers from './platforms-types/sound';
import { ProcessedTrack } from './track';

export enum MusicPlatformType {
  sound = 'sound',
  noizd = 'noizd',
  catalog = 'catalog',
  zora = 'zora',
  'single-track-multiprint-contract' = 'single-track-multiprint-contract'
}

export type MusicPlatform = {
  id: string,
  type: MusicPlatformType
}

export type PlatformMapper = {
  mapNFTsToTrackIds: (nfts: ERC721NFT[]) => { [trackId: string]: ERC721NFT[] }
  mapTrack: (nft: ERC721NFT, apiTrack: any, contract?: ERC721Contract) => ProcessedTrack
  mapArtistProfile: ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract }) => ArtistProfile
}

export type MusicPlatformTypeConfig = {
  mappers: PlatformMapper
  clientName: string | null
  initialTrackCursor?: string
};

export type MusicPlatformTypeConfigs = {
  [key in MusicPlatformType]?: MusicPlatformTypeConfig
}

export const platformConfigs: MusicPlatformTypeConfigs = {
  sound: {
    mappers: soundMappers,
    clientName: 'sound',
  },
  catalog: {
    mappers: catalogMappers,
    clientName: 'catalog',
  },
  noizd: {
    mappers: noizdMappers,
    clientName: 'noizd',
    initialTrackCursor: '2020-04-07T21:11:16.494Z'

  },
  'single-track-multiprint-contract': {
    mappers: singleTrackMultiprintContract,
    clientName: null,
  }
}
