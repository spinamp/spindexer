import { DBClient } from '../db/db';

import { ArtistProfile } from './artist';
import { NFT, NftFactory } from './nft';
import catalogMappers from './platforms-types/catalog';
import chaosMappers from './platforms-types/chaos';
import mintsongsV2Mappers from './platforms-types/mintsongs-v2';
import multiTrackMultiprintContractMappers from './platforms-types/multi-track-multiprint-contract';
import ninaMappers from './platforms-types/nina'
import noizdMappers from './platforms-types/noizd';
import singleTrackMultiprintContractMappers from './platforms-types/single-track-multiprint-contract';
import soundMappers from './platforms-types/sound';
import zoraMappers from './platforms-types/zora';
import { ProcessedTrack } from './track';

export enum MusicPlatformType {
  sound = 'sound',
  noizd = 'noizd',
  catalog = 'catalog',
  zora = 'zora',
  'single-track-multiprint-contract' = 'single-track-multiprint-contract',
  'multi-track-multiprint-contract' = 'multi-track-multiprint-contract',
  chaos = 'chaos',
  mintsongsV2 = 'mintsongs-v2',
  nina = 'nina'
}

export type MusicPlatform = {
  id: string,
  type: MusicPlatformType
  name: string
}

export type PlatformMapper = {
  mapNFTsToTrackIds: (nfts: NFT[], dbClient?: DBClient) => Promise<{ [trackId: string]: NFT[] }>
  mapTrack: (nft: NFT, apiTrack: any, contract?: NftFactory) => ProcessedTrack
  mapArtistProfile: ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }) => ArtistProfile
  selectPrimaryNFTForTrackMapper?: (nfts: NFT[]) => NFT
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
    mappers: singleTrackMultiprintContractMappers,
    clientName: null,
  },
  'multi-track-multiprint-contract': {
    mappers: multiTrackMultiprintContractMappers,
    clientName: null,
  },
  'chaos': {
    mappers: chaosMappers,
    clientName: null,
  },
  'mintsongs-v2': {
    mappers: mintsongsV2Mappers,
    clientName: null,
  },
  'nina': {
    mappers: ninaMappers,
    clientName: null
  },
  zora: {
    mappers: zoraMappers,
    clientName: null
  }
}
