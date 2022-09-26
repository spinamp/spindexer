import { ethereumTrackId, slugify } from '../utils/identifiers';
import { dropLeadingInfo, dropTrailingInfo } from '../utils/sanitizers';

import { getTrait, NFT, NftFactory } from './nft';

export type ExtractorTypes = {
  id?: IdExtractorTypes
  title?: TitleExtractorTypes
  audioUrl?: AudioUrlExtractorTypes
  artworkUrl?: ArtworkUrlExtractorTypes
  websiteUrl?: WebsiteUrlExtractorTypes
  artistName?: ArtistNameExtractorTypes,
  artistId?: ArtistIdExtractorTypes,
}

export enum TitleExtractorTypes {
  METADATA_NAME = 'metadata.name',
  METADATA_NAME_WITHOUT_LEADING_INFO = 'metadataNameWithoutLeadingInfo',
  METADATA_NAME_WITHOUT_TRAILING_INFO = 'metadataNameWithoutTrailingInfo',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track',
}

export enum IdExtractorTypes {
  USE_TITLE_EXTRACTOR = 'useTitleExtractor',
}

export enum AudioUrlExtractorTypes {
  METADATA_ANIMATION_URL = 'metadata.animation_url',
  ATTRIBUTES_TRAIT_AUDIO = 'attributes.trait.audio',
}

export enum ArtworkUrlExtractorTypes {
  METADATA_IMAGE = 'metadata.image',
  USE_ARTWORK_URL_OVERRIDE = 'useArtworkUrlOverride',
}

export enum WebsiteUrlExtractorTypes {
  METADATA_EXTERNAL_URL = 'metadata.externalUrl',
  USE_TOKEN_ID_APPENDED_EXTERNAL_URL = 'useTokenIdAppendedExternalUrl',
}

export enum ArtistNameExtractorTypes {
  ATTRIBUTES_TRAIT_MUSICIAN = 'attributes.trait.musician',
}

export enum ArtistIdExtractorTypes {
  USE_PLATFORM_AND_ARTIST_NAME = 'usePlatformAndArtistName',
  USE_PLATFORM_ID = 'usePlatformId',
}

export type Extractor = (nft: NFT) => string;
export type TitleExtractorMapping = Record<TitleExtractorTypes, Extractor>
export type AudioUrlExtractorMapping = Record<AudioUrlExtractorTypes, Extractor>
export type ArtworkUrlExtractorMapping = Record<ArtworkUrlExtractorTypes, Extractor>
export type WebsiteUrlExtractorMapping = Record<WebsiteUrlExtractorTypes, Extractor>
export type ArtistNameExtractorMapping = Record<ArtistNameExtractorTypes, Extractor>

export const titleExtractors: TitleExtractorMapping = {
  [TitleExtractorTypes.METADATA_NAME]: (nft: NFT) => nft.metadata.name,
  [TitleExtractorTypes.METADATA_NAME_WITHOUT_LEADING_INFO]: (nft: NFT) => dropLeadingInfo(nft.metadata.name),
  [TitleExtractorTypes.METADATA_NAME_WITHOUT_TRAILING_INFO]: (nft: NFT) => dropTrailingInfo(nft.metadata.name),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_SONG_TITLE]: (nft: NFT) => getTrait(nft, 'Song Title'),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_TRACK]: (nft: NFT) => getTrait(nft, 'Track'),
}

export const audioUrlExtractors: AudioUrlExtractorMapping = {
  [AudioUrlExtractorTypes.METADATA_ANIMATION_URL]: (nft: NFT) => nft.metadata.animation_url,
  [AudioUrlExtractorTypes.ATTRIBUTES_TRAIT_AUDIO]: (nft: NFT) => getTrait(nft, 'Audio'),
}

export const websiteUrlExtractors: WebsiteUrlExtractorMapping = {
  [WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL]: (nft: NFT) => nft.metadata.external_url,
  [WebsiteUrlExtractorTypes.USE_TOKEN_ID_APPENDED_EXTERNAL_URL]: (nft: NFT) => useTokenIdAppendedExternalUrl(nft),
}

export const artistNameExtractors: ArtistNameExtractorMapping = {
  [ArtistNameExtractorTypes.ATTRIBUTES_TRAIT_MUSICIAN]: (nft: NFT) => getTrait(nft, 'Musician'),
}

const useTokenIdAppendedExternalUrl = (nft: NFT): string => {
  const url = new URL(nft.metadata.external_url);
  return `${url.origin}/token/${nft.tokenId}`;
}

export const artistNameExtractor = (contract: NftFactory): Extractor => {
  const artistNameExtractorOverride = contract.typeMetadata?.overrides?.extractor?.artistName;
  if (!artistNameExtractorOverride) {
    throw new Error('unknown extractor override provided')
  }
  return artistNameExtractors[artistNameExtractorOverride];
}

export const websiteUrlExtractor = (contract: NftFactory): Extractor => {
  const websiteUrlExtractorOverride = contract.typeMetadata?.overrides?.extractor?.websiteUrl;
  if (!websiteUrlExtractorOverride) {
    return websiteUrlExtractors[WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL]
  }
  return websiteUrlExtractors[websiteUrlExtractorOverride];
}

export const audioUrlExtractor = (contract: NftFactory): Extractor => {
  const audioUrlExtractorOverride = contract.typeMetadata?.overrides?.extractor?.audioUrl;
  if (!audioUrlExtractorOverride) {
    return audioUrlExtractors[AudioUrlExtractorTypes.METADATA_ANIMATION_URL]
  }
  return audioUrlExtractors[audioUrlExtractorOverride];
}

export const titleExtractor = (contract: NftFactory): Extractor => {
  const titleExtractorOverride = contract.typeMetadata?.overrides?.extractor?.title;
  if (!titleExtractorOverride) {
    throw new Error('unknown extractor override provided')
  }
  return titleExtractors[titleExtractorOverride];
}

export const idExtractor = (contract: NftFactory): Extractor => {
  const idExtractorOverride = contract.typeMetadata?.overrides?.extractor?.id;
  if (!idExtractorOverride) {
    throw new Error('unknown extractor override provided')
  }
  if (idExtractorOverride === IdExtractorTypes.USE_TITLE_EXTRACTOR) {
    return titleExtractor(contract);
  }
  throw new Error('no other id extraction options yet')
}

export const resolveEthereumTrackIdOverrides = (nft: NFT, contract: NftFactory): string => {
  const extractor = idExtractor(contract)
  const trackId = slugify(extractor(nft));
  if (!trackId) {
    throw new Error('ID not extracted correctly');
  }
  return ethereumTrackId(nft.contractAddress, trackId);
}

export const resolveArtworkUrlOverrides = (nft: NFT, contract: NftFactory): string => {
  const override = contract.typeMetadata?.overrides?.extractor?.artworkUrl;

  if (override === ArtworkUrlExtractorTypes.USE_ARTWORK_URL_OVERRIDE) {
    const track = contract.typeMetadata?.overrides?.track;
    const url = (track as any).lossyArtworkURL;
    if (!url) {
      throw new Error('track lossy artwork url override not provided');
    }
    return url;
  }
  return nft.metadata.image
}

export const resolveArtistNameOverrides = (nft: NFT, contract: NftFactory): string => {
  const artistNameExtractorOverride = contract.typeMetadata?.overrides?.extractor?.artistName;
  if (!artistNameExtractorOverride || (artistNameExtractorOverride !== ArtistNameExtractorTypes.ATTRIBUTES_TRAIT_MUSICIAN)) {
    return contract.platformId;
  }
  return artistNameExtractor(contract)(nft);
}

export const resolveArtistIdOverrides = (nft: NFT, contract: NftFactory): string => {
  const artistIdExtractorOverride = contract.typeMetadata?.overrides?.extractor?.artistId;
  if (artistIdExtractorOverride) {
    if (artistIdExtractorOverride === ArtistIdExtractorTypes.USE_PLATFORM_ID) {
      return contract.platformId;
    }
    else if (artistIdExtractorOverride === ArtistIdExtractorTypes.USE_PLATFORM_AND_ARTIST_NAME) {
      return `${contract.platformId}/${slugify(resolveArtistNameOverrides(nft, contract))}`;
    }
  }

  const artistIdOverride = contract.typeMetadata?.overrides?.artist?.artistId;
  if (!artistIdOverride) {
    throw new Error('must directly provided an artist ID override, or an artist ID extractor override');
  }
  return artistIdOverride;
}
