import { ethereumArtistId, ethereumTrackId, slugify } from '../utils/identifiers';
import { cleanURL, dropLeadingInfo, dropTrailingInfo } from '../utils/sanitizers';

import { getTrait, NFT, NftFactory } from './nft';

type Extractor = (nft: NFT) => string;
type StrategyExtractor = (nftFactory: NftFactory) => Extractor;
type Resolver = (nft: NFT, contract: NftFactory) => string;

export type ExtractorTypes = {
  id?: IdExtractorTypes
  title?: TitleExtractorTypes
  audioUrl?: AudioUrlExtractorTypes
  artworkUrl?: ArtworkUrlExtractorTypes
  avatarUrl?: AvatarUrlExtractorTypes
  websiteUrl?: WebsiteUrlExtractorTypes
  artistName?: ArtistNameExtractorTypes
  artistId?: ArtistIdExtractorTypes
}

export enum TitleExtractorTypes {
  METADATA_NAME = 'metadata.name',
  METADATA_TITLE = 'metadata.title',
  METADATA_NAME_WITHOUT_LEADING_INFO = 'metadataNameWithoutLeadingInfo',
  METADATA_NAME_WITHOUT_TRAILING_INFO = 'metadataNameWithoutTrailingInfo',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track',
}

export enum IdExtractorTypes {
  USE_TITLE_EXTRACTOR = 'useTitleExtractor',
  CONTRACT_ADDRESS = 'contractAddress'
}

export enum AudioUrlExtractorTypes {
  METADATA_ANIMATION_URL = 'metadata.animation_url',
  ATTRIBUTES_TRAIT_AUDIO = 'attributes.trait.audio',
}

export enum ArtworkUrlExtractorTypes {
  METADATA_IMAGE = 'metadata.image',
  USE_ARTWORK_URL_OVERRIDE = 'useArtworkUrlOverride',
}

export enum AvatarUrlExtractorTypes {
  METADATA_IMAGE = 'metadata.image',
}

export enum WebsiteUrlExtractorTypes {
  METADATA_EXTERNAL_URL = 'metadata.externalUrl',
  USE_TOKEN_ID_APPENDED_EXTERNAL_URL = 'useTokenIdAppendedExternalUrl',
  EXTERNAL_URL_WITH_ONLY_FIRST_SEGMENT = 'externalUrlWithOnlyFirstSegment',
}

export enum ArtistNameExtractorTypes {
  ATTRIBUTES_TRAIT_MUSICIAN = 'attributes.trait.musician',
  USE_ARTIST_NAME_OVERRIDE = 'useArtistNameOverride',
  METADATA_ARTIST = 'metadataArtist',
}

export enum ArtistIdExtractorTypes {
  USE_PLATFORM_AND_ARTIST_NAME = 'usePlatformAndArtistName',
  USE_PLATFORM_ID = 'usePlatformId',
  USE_ARTIST_ID_OVERRIDE = 'useArtistIdOverride',
}

type IdExtractorMapping = Record<Partial<IdExtractorTypes>, Extractor>
type TitleExtractorMapping = Record<TitleExtractorTypes, Extractor>
type AudioUrlExtractorMapping = Record<AudioUrlExtractorTypes, Extractor>
type WebsiteUrlExtractorMapping = Record<WebsiteUrlExtractorTypes, Extractor>
type AvatarUrlExtractorMapping = Record<AvatarUrlExtractorTypes, Extractor>

const idExtractors: IdExtractorMapping = {
  [IdExtractorTypes.USE_TITLE_EXTRACTOR]: (nft: NFT) => { throw new Error('Unexpected code path - title extractor should already be applied') },
  [IdExtractorTypes.CONTRACT_ADDRESS]: (nft: NFT) => nft.contractAddress,
}

const titleExtractors: TitleExtractorMapping = {
  [TitleExtractorTypes.METADATA_NAME]: (nft: NFT) => nft.metadata.name,
  [TitleExtractorTypes.METADATA_TITLE]: (nft: NFT) => nft.metadata.title,
  [TitleExtractorTypes.METADATA_NAME_WITHOUT_LEADING_INFO]: (nft: NFT) => dropLeadingInfo(nft.metadata.name),
  [TitleExtractorTypes.METADATA_NAME_WITHOUT_TRAILING_INFO]: (nft: NFT) => dropTrailingInfo(nft.metadata.name),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_SONG_TITLE]: (nft: NFT) => getTrait(nft, 'Song Title'),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_TRACK]: (nft: NFT) => getTrait(nft, 'Track'),
}

const audioUrlExtractors: AudioUrlExtractorMapping = {
  [AudioUrlExtractorTypes.METADATA_ANIMATION_URL]: (nft: NFT) => cleanURL(nft.metadata.animation_url),
  [AudioUrlExtractorTypes.ATTRIBUTES_TRAIT_AUDIO]: (nft: NFT) => cleanURL( getTrait(nft, 'Audio')),
}

const websiteUrlExtractors: WebsiteUrlExtractorMapping = {
  [WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL]: (nft: NFT) => nft.metadata.external_url,
  [WebsiteUrlExtractorTypes.USE_TOKEN_ID_APPENDED_EXTERNAL_URL]: (nft: NFT) => useTokenIdAppendedExternalUrl(nft),
  [WebsiteUrlExtractorTypes.EXTERNAL_URL_WITH_ONLY_FIRST_SEGMENT]: (nft: NFT) => externalURLWithOnlyFirstSegment(nft),
}

const avatarUrlExtractors: AvatarUrlExtractorMapping = {
  [AvatarUrlExtractorTypes.METADATA_IMAGE]: (nft: NFT) => cleanURL(nft.metadata.image || ''),
}

const externalURLWithOnlyFirstSegment: Extractor = (nft) => {
  const url = new URL(nft.metadata.external_url);
  return `${url.origin}/${url.pathname.split('/')[1]}`;
}
const useTokenIdAppendedExternalUrl: Extractor = (nft) => {
  const url = new URL(nft.metadata.external_url);
  return `${url.origin}/token/${nft.tokenId}`;
}

const websiteUrlStrategy: StrategyExtractor = (contract) => {
  const websiteUrlExtractorOverride = contract.typeMetadata?.overrides?.extractor?.websiteUrl;
  if (!websiteUrlExtractorOverride) {
    return websiteUrlExtractors[WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL]
  }
  return websiteUrlExtractors[websiteUrlExtractorOverride];
}

const audioUrlStrategy: StrategyExtractor = (contract) => {
  const audioUrlExtractorOverride = contract.typeMetadata?.overrides?.extractor?.audioUrl;
  if (!audioUrlExtractorOverride) {
    return audioUrlExtractors[AudioUrlExtractorTypes.METADATA_ANIMATION_URL]
  }
  return audioUrlExtractors[audioUrlExtractorOverride];
}

const titleStrategy: StrategyExtractor = (contract) => {
  const titleExtractorOverride = contract.typeMetadata?.overrides?.extractor?.title;
  if (!titleExtractorOverride) {
    throw new Error('unknown extractor override provided')
  }
  return titleExtractors[titleExtractorOverride];
}

const idStrategy: StrategyExtractor = (contract) => {
  const idExtractorOverride = contract.typeMetadata?.overrides?.extractor?.id;
  if (!idExtractorOverride) {
    throw new Error('unknown extractor override provided')
  }
  if (idExtractorOverride === IdExtractorTypes.USE_TITLE_EXTRACTOR) {
    return titleStrategy(contract);
  }
  const extractor = idExtractors[idExtractorOverride];
  if (!extractor) {
    throw new Error('no other id extraction options yet')
  }
  return extractor;
}

export const resolveEthereumTrackId: Resolver = (nft, contract) => {
  const extractor = idStrategy(contract)
  const trackId = slugify(extractor(nft));
  if (!trackId) {
    throw new Error(`ID not extracted correctly for nft: ${nft.id}`);
  }
  return ethereumTrackId(nft.contractAddress, trackId);
}

export const resolveAvatarUrl: Resolver = (nft) => {
  const defaultExtractor = avatarUrlExtractors[AvatarUrlExtractorTypes.METADATA_IMAGE];
  return defaultExtractor(nft);
}

export const resolveArtworkUrl: Resolver = (nft, contract) => {
  const override = contract.typeMetadata?.overrides?.extractor?.artworkUrl;

  if (override === ArtworkUrlExtractorTypes.USE_ARTWORK_URL_OVERRIDE) {
    const track = contract.typeMetadata?.overrides?.track;
    const url = (track as any).lossyArtworkURL;
    if (!url) {
      throw new Error('track lossy artwork url override not provided');
    }
    return cleanURL(url);
  }
  return cleanURL(nft.metadata.image)
}

export const resolveArtistName: Resolver = (nft, contract) => {
  const artistNameExtractorOverride = contract.typeMetadata?.overrides?.extractor?.artistName;

  if (artistNameExtractorOverride === ArtistNameExtractorTypes.ATTRIBUTES_TRAIT_MUSICIAN) {
    return getTrait(nft, 'Musician');
  } else if (artistNameExtractorOverride === ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE) {
    const artistNameOverride = contract.typeMetadata?.overrides?.artist?.name;
    if (!artistNameOverride) {
      throw new Error('must directly provided an artist name override, or an artist name extractor override');
    }
    return artistNameOverride;
  } else if (artistNameExtractorOverride === ArtistNameExtractorTypes.METADATA_ARTIST) {
    return nft.metadata.artist;
  }

  throw new Error('must specify artist name extractor');
}

export const resolveArtistId: Resolver = (nft, contract) => {
  const artistIdExtractorOverride = contract.typeMetadata?.overrides?.extractor?.artistId;
  if (artistIdExtractorOverride) {
    if (artistIdExtractorOverride === ArtistIdExtractorTypes.USE_PLATFORM_ID) {
      return contract.platformId;
    }
    else if (artistIdExtractorOverride === ArtistIdExtractorTypes.USE_PLATFORM_AND_ARTIST_NAME) {
      return `${contract.platformId}/${slugify(resolveArtistName(nft, contract))}`;
    }
    else if (artistIdExtractorOverride === ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE) {
      const artistIdOverride = contract.typeMetadata?.overrides?.artist?.artistId;
      if (!artistIdOverride) {
        throw new Error('must directly provided an artist ID override, or an artist ID extractor override');
      }
      return artistIdOverride;
    }
  }

  return ethereumArtistId(contract.id);
}

export const resolveWebsiteUrl: Resolver = (nft, contract) => {
  return websiteUrlStrategy(contract)(nft);
}

export const resolveAudioUrl: Resolver = (nft, contract) => {
  return audioUrlStrategy(contract)(nft);
}

export const resolveTitle: Resolver = (nft, contract) => {
  return titleStrategy(contract)(nft);
}
