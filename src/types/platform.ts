// import { ArtistProfile } from './artist';
// import { Metadata } from './metadata';
import { ArtistProfile } from './artist';
import { ERC721NFT } from './erc721nft';
import catalogMappers from './platforms/catalog';
import noizdMappers from './platforms/noizd';
import soundMappers from './platforms/sound';
import { Clients } from './processor';
import { NFTProcessError, NFTTrackJoin, ProcessedTrack } from './track';

export enum MusicPlatform {
  sound = 'sound',
  zora = 'zora',
  noizd = 'noizd',
  catalog = 'catalog',
  zoraRaw = 'zoraRaw',
  other = 'other'
}

export type PlatformMapper = {
  // addPlatformTrackData: (metadatas: Metadata[], client: any) => Promise<{
  //   metadata: Metadata;
  //   platformTrackResponse: unknown;
  // }[]>;
  // mapTrack: (item: {
  //   metadata: Metadata;
  //   platformTrackResponse: unknown;
  // }) => ProcessedTrack;
  // mapAPITrack?: (trackItem: unknown) => ProcessedTrack;
  // mapAPITrackTime?: (trackItem: unknown) => Date;
  // mapArtistProfile: (artistItem: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string) => ArtistProfile;
  mapNFTsToTrackIds: (nfts:ERC721NFT[]) => { [trackId: string]:ERC721NFT[] }
  createTracks: (newTrackIds:string[], trackMapping: { [trackId: string]:ERC721NFT[] }, clients: Clients) => Promise<{
    newTracks: ProcessedTrack[],
    joins: NFTTrackJoin[],
    errorNFTs: NFTProcessError[]
    artistProfiles: ArtistProfile[]
  }>
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
