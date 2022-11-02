
import { artistId, slugify, solanaTrackId, trackId } from '../utils/identifiers';
import { cleanURL, dropLeadingInfo, dropTrailingInfo } from '../utils/sanitizers';

import { getTrait, NFT, NftFactory } from './nft';

type Extractor = (nft: NFT) => string;
type ParameterizedExtractor = (params: any) => Extractor;
type ParameterizedExtractorConfig<T> = { extractor: T, params: any }
type StrategyExtractor = (nftFactory: NftFactory) => Extractor
type Resolver = (nft: NFT, contract: NftFactory) => string;

function isParameterizedExtractor(extractor?: string | ParameterizedExtractorConfig<any>) {
  return extractor && typeof extractor !== 'string';
}

export type ExtractorTypes = {
  id?: IdExtractorTypes | ParameterizedExtractorConfig<IdExtractorTypes>
  title?: TitleExtractorTypes
  audioUrl?: AudioUrlExtractorTypes
  artworkUrl?: ArtworkUrlExtractorTypes
  avatarUrl?: AvatarUrlExtractorTypes
  websiteUrl?: WebsiteUrlExtractorTypes
  artistWebsiteUrl?: WebsiteUrlExtractorTypes
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
  TRACK_NUMBER = 'trackNumber',
  USE_METAFACTORY_AND_TITLE_EXTRACTOR = 'useMetafactoryAndTitleExtractor'
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

type IdExtractorMapping = Record<Partial<IdExtractorTypes>, Extractor | ParameterizedExtractor>
type TitleExtractorMapping = Record<TitleExtractorTypes, Extractor>
type AudioUrlExtractorMapping = Record<AudioUrlExtractorTypes, Extractor>
type WebsiteUrlExtractorMapping = Record<WebsiteUrlExtractorTypes, Extractor>
type AvatarUrlExtractorMapping = Record<AvatarUrlExtractorTypes, Extractor>

const idExtractors: IdExtractorMapping = {
  [IdExtractorTypes.USE_TITLE_EXTRACTOR]: (nft: NFT) => { throw new Error('Unexpected code path - title extractor should already be applied') },
  [IdExtractorTypes.TRACK_NUMBER]: (nft: NFT) => {
    if (!nft.metadata.trackNumber) {
      throw new Error(`nft ${nft.id} missing track number`);
    }
    return `${nft.metadata.trackNumber}`
  },
  [IdExtractorTypes.USE_METAFACTORY_AND_TITLE_EXTRACTOR]: (params: { metaFactoryId: string, nftFactory: NftFactory }) => (nft: NFT) => {
    const title = titleStrategy(params.nftFactory)(nft);
    return solanaTrackId(params.metaFactoryId, title);
  }
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

const artistWebsiteUrlStrategy: StrategyExtractor = (contract) => {
  const artistWebsiteUrlExtractorOverride = contract.typeMetadata?.overrides?.extractor?.artistWebsiteUrl;
  if (!artistWebsiteUrlExtractorOverride) {
    return websiteUrlExtractors[WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL]
  }
  return websiteUrlExtractors[artistWebsiteUrlExtractorOverride];
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

const trackIdSuffixStrategy: StrategyExtractor = (contract) => {
  const idExtractorOverride = contract.typeMetadata?.overrides?.extractor?.id;
  if (!idExtractorOverride) {
    throw new Error('unknown extractor override provided')
  }
  if (idExtractorOverride === IdExtractorTypes.USE_TITLE_EXTRACTOR) {
    return titleStrategy(contract);
  }
  let extractor = null;
  if (typeof idExtractorOverride === 'string'){
    extractor = idExtractors[idExtractorOverride];
  }

  if (!extractor) {
    throw new Error('no other id extraction options yet')
  }
  return extractor as Extractor;
}

export const resolveTrackId: Resolver = (nft, contract) => {
  if (isParameterizedExtractor(contract.typeMetadata?.overrides.extractor?.id)){
    const type = (contract.typeMetadata?.overrides.extractor?.id as ParameterizedExtractorConfig<IdExtractorTypes>)
    const extractorType = type.extractor;
    const extractor = idExtractors[extractorType]({ ...type.params, nftFactory: contract }) as Extractor;
    return extractor(nft)
  }

  const extractor = trackIdSuffixStrategy(contract)
  const id = slugify(extractor(nft));
  if (!id) {
    throw new Error(`ID not extracted correctly for nft: ${nft.id}`);
  }

  return trackId(contract, nft.contractAddress, id);
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
  let name;

  if (artistNameExtractorOverride === ArtistNameExtractorTypes.ATTRIBUTES_TRAIT_MUSICIAN) {
    name = getTrait(nft, 'Musician');
  } else if (artistNameExtractorOverride === ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE) {
    const artistNameOverride = contract.typeMetadata?.overrides?.artist?.name;
    if (!artistNameOverride) {
      throw new Error('must directly provided an artist name override, or an artist name extractor override');
    }
    name = artistNameOverride;
  } else if (artistNameExtractorOverride === ArtistNameExtractorTypes.METADATA_ARTIST) {
    name = nft.metadata.artist;
  }

  if (!name){
    name = resolveArtistId(nft, contract);
  }

  return name;

}

export const resolveArtistId: Resolver = (nft, contract) => {
  const artistIdExtractorOverride = contract.typeMetadata?.overrides?.extractor?.artistId;
  if (artistIdExtractorOverride) {
    switch (artistIdExtractorOverride){
      case ArtistIdExtractorTypes.USE_PLATFORM_ID:
        return contract.platformId;
      case ArtistIdExtractorTypes.USE_PLATFORM_AND_ARTIST_NAME:
        return `${contract.platformId}/${slugify(resolveArtistName(nft, contract))}`;
      case ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE:
        const artistIdOverride = contract.typeMetadata?.overrides?.artist?.artistId;
        if (!artistIdOverride) {
          throw new Error('must directly provided an artist ID override, or an artist ID extractor override');
        }
        return artistIdOverride;
    }
  }

  return artistId(contract, contract.id);
}

export const resolveWebsiteUrl: Resolver = (nft, contract) => {
  return websiteUrlStrategy(contract)(nft);
}

export const resolveArtistWebsiteUrl: Resolver = (nft, contract) => {
  return artistWebsiteUrlStrategy(contract)(nft);
}

export const resolveAudioUrl: Resolver = (nft, contract) => {
  return audioUrlStrategy(contract)(nft);
}

export const resolveTitle: Resolver = (nft, contract) => {
  return titleStrategy(contract)(nft);
}
