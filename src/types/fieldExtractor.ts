import { ethereumTrackId, slugify } from '../utils/identifiers';
import { dropLeadingInfo } from '../utils/sanitizers';

import { getTrait, NFT, NftFactory } from './nft';

export type ExtractorTypes = {
  title?: TitleExtractorTypes
  id?: IdExtractorTypes
}

export enum TitleExtractorTypes {
  METADATA_NAME = 'metadata.name',
  METADATA_NAME_WITHOUT_LEADING_INFO = 'metadataNameWithoutLeadingInfo',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track',
}

export enum IdExtractorTypes {
  USE_TITLE_EXTRACTOR = 'useTitleExtractor',
}

export type Extractor = (nft: NFT) => string;
export type TitleExtractorMapping = Record<TitleExtractorTypes, Extractor>

export const titleExtractors: TitleExtractorMapping = {
  [TitleExtractorTypes.METADATA_NAME]: (nft: NFT) => nft.metadata.name,
  [TitleExtractorTypes.METADATA_NAME_WITHOUT_LEADING_INFO]: (nft: NFT) => dropLeadingInfo(nft.metadata.name),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_SONG_TITLE]: (nft: NFT) => getTrait(nft, 'Song Title'),
  [TitleExtractorTypes.ATTRIBUTES_TRAIT_TRACK]: (nft: NFT) => getTrait(nft, 'Track')
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
