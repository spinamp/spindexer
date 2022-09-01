import { DBClient } from '../db/db';

import { ArtistProfile } from './artist';
import { NFT, NftFactory } from './nft';
import catalogMappers from './platforms-types/catalog';
import chaosMappers from './platforms-types/chaos';
import hedsCollabMappers from './platforms-types/heds-collab';
import mintsongsV2Mappers from './platforms-types/mintsongs-v2';
import multiTrackMultiprintContractMappers from './platforms-types/multi-track-multiprint-contract';
import ninaMappers from './platforms-types/nina'
import noizdMappers from './platforms-types/noizd';
import singleTrackMultiprintContractMappers from './platforms-types/single-track-multiprint-contract';
import soundMappers from './platforms-types/sound';
import zoraMappers from './platforms-types/zora';
import { ProcessedTrack } from './track';

export const API_PLATFORMS = ['noizd'];

export enum MusicPlatformType {
  sound = 'sound',
  noizd = 'noizd',
  catalog = 'catalog',
  zora = 'zora',
  'single-track-multiprint-contract' = 'single-track-multiprint-contract',
  'multi-track-multiprint-contract' = 'multi-track-multiprint-contract',
  chaos = 'chaos',
  mintsongsV2 = 'mintsongs-v2',
  nina = 'nina',
  hedsCollab = 'heds-collab'
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
  initialTrackCursor?: string
};

export type MusicPlatformTypeConfigs = {
  [key in MusicPlatformType]?: MusicPlatformTypeConfig
}

export const platformClients = {
  sound: 'sound',
  catalog: 'catalog',
  noizd: 'noizd',
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
  'single-track-multiprint-contract': {
    mappers: singleTrackMultiprintContractMappers,
  },
  'multi-track-multiprint-contract': {
    mappers: multiTrackMultiprintContractMappers,
  },
  'chaos': {
    mappers: chaosMappers,
  },
  'mintsongs-v2': {
    mappers: mintsongsV2Mappers,
  },
  'nina': {
    mappers: ninaMappers,
  },
  'heds-collab': {
    mappers: hedsCollabMappers,
  },
  zora: {
    mappers: zoraMappers,
    clientName: null
  }
}
