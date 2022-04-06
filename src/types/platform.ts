import { CatalogClient } from "../clients/catalog";
import { ValidContractCallFunction } from "../clients/ethereum";
import { ArtistProfile, Artist } from "./artist";
import catalogMappers from './platforms/catalog';
import { Track, ProcessedTrack } from "./track";

export enum MusicPlatform {
  sound = "sound",
  zora = "zora",
  noizd = "noizd",
  catalog = "catalog",
  zoraRaw = "zoraRaw",
  other = "other"
}

export type PlatformMapper = {
  addPlatformTrackData: (tracks: Track[], client: CatalogClient) => Promise<{
    track: Track;
    platformTrackResponse?: any;
  }[]>;
  getTokenIdFromTrack: (track: Track) => string;
  mapTrackID: (trackId: string) => string;
  mapTrack: (trackItem: {
    track: Track;
    platformTrackResponse?: any;
  }) => ProcessedTrack;
  mapArtistID: (artistId: string) => string;
  mapArtistProfile: (artistItem: any, createdAtBlockNumber: string) => ArtistProfile;
  mapArtist: (artistProfile: ArtistProfile) => Artist;
}

export type PlatformConfigItem = {
  contractCalls: ValidContractCallFunction[],
  contractMetadataField: ValidContractCallFunction,
  mappers?: PlatformMapper
};

export type PlatformConfig = {
  [key in MusicPlatform]: PlatformConfigItem
}

export const platformConfig: PlatformConfig = {
  sound: {
    contractCalls: [ValidContractCallFunction.tokenURI],
    contractMetadataField: ValidContractCallFunction.tokenURI,
  },
  zora: {
    contractCalls: [ValidContractCallFunction.tokenURI, ValidContractCallFunction.tokenMetadataURI],
    contractMetadataField: ValidContractCallFunction.tokenMetadataURI,
  },
  catalog: {
    contractCalls: [ValidContractCallFunction.tokenURI, ValidContractCallFunction.tokenMetadataURI],
    contractMetadataField: ValidContractCallFunction.tokenMetadataURI,
    mappers: catalogMappers,
  },
  zoraRaw: {
    contractCalls: [ValidContractCallFunction.tokenURI, ValidContractCallFunction.tokenMetadataURI],
    contractMetadataField: ValidContractCallFunction.tokenMetadataURI,
  },
  noizd: {
    contractCalls: [ValidContractCallFunction.tokenURI],
    contractMetadataField: ValidContractCallFunction.tokenURI,
  },
  other: {
    contractCalls: [ValidContractCallFunction.tokenURI],
    contractMetadataField: ValidContractCallFunction.tokenURI,
  }
}
