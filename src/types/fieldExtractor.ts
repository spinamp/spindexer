import { ethereumTrackId, slugify } from '../utils/identifiers';
import { dropLeadingInfo } from '../utils/sanitizers';

import { getTrait, NFT, NftFactory } from './nft';

export type ExtractorTypes = {
  title?: TitleExtractorTypes
  id?: IdExtractorTypes
  websiteUrl?: WebsiteUrlExtractorTypes
}

export enum TitleExtractorTypes {
  METADATA_NAME = 'metadata.name',
  METADATA_NAME_WITHOUT_LEADING_INFO = 'metadataNameWithoutLeadingInfo',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track',
}

export enum IdExtractorTypes {
  USE_TITLE_EXTRACTOR = 'useTitleExtractor',
  CONTRACT_ADDRESS = 'contractAddress'
}

export enum WebsiteUrlExtractorTypes {
  METADATA_EXTERNAL_URL = 'metadata.externalUrl',
  USE_TOKEN_ID_APPENDED_EXTERNAL_URL = 'useTokenIdAppendedExternalUrl',
}

export type Extractor = (nft: NFT) => string;
export type IdExtractorMapping = Record<Partial<IdExtractorTypes>, Extractor>
export type TitleExtractorMapping = Record<TitleExtractorTypes, Extractor>
export type WebsiteUrlExtractorMapping = Record<WebsiteUrlExtractorTypes, Extractor>

export const idExtractors: IdExtractorMapping = {
  [IdExtractorTypes.USE_TITLE_EXTRACTOR]: (nft: NFT) => { throw new Error('Unexpected code path - title extractor should already be applied') },
  [IdExtractorTypes.CONTRACT_ADDRESS]: (nft: NFT) => nft.contractAddress,
}

export const titleExtractors: TitleExtractorMapping = {
  [TitleExtractorTypes.METADATA_NAME]: (nft: NFT) => nft.metadata.name,
  [TitleExtractorTypes.METADATA_NAME_WITHOUT_LEADING_INFO]: (nft: NFT) => dropLeadingInfo(nft.metadata.name),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_SONG_TITLE]: (nft: NFT) => getTrait(nft, 'Song Title'),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_TRACK]: (nft: NFT) => getTrait(nft, 'Track'),
}

export const websiteUrlExtractors: WebsiteUrlExtractorMapping = {
  [WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL]: (nft: NFT) => nft.metadata.external_url,
  [WebsiteUrlExtractorTypes.USE_TOKEN_ID_APPENDED_EXTERNAL_URL]: (nft: NFT) => useTokenIdAppendedExternalUrl(nft),
}

const useTokenIdAppendedExternalUrl = (nft: NFT): string => {
  const url = new URL(nft.metadata.external_url);
  return `${url.origin}/token/${nft.tokenId}`;
}

export const websiteUrlExtractor = (contract: NftFactory): Extractor => {
  const websiteUrlExtractorOverride = contract.typeMetadata?.overrides?.extractor?.websiteUrl;
  if (!websiteUrlExtractorOverride) {
    return websiteUrlExtractors[WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL]
  }
  return websiteUrlExtractors[websiteUrlExtractorOverride];
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
  const extractor = idExtractors[idExtractorOverride];
  if (!extractor) {
    throw new Error('no other id extraction options yet')
  }
  return extractor;
}

export const resolveEthereumTrackIdOverrides = (nft: NFT, contract: NftFactory): string => {
  const extractor = idExtractor(contract)
  const trackId = slugify(extractor(nft));
  if (!trackId) {
    throw new Error('ID not extracted correctly');
  }
  return ethereumTrackId(nft.contractAddress, trackId);
}
