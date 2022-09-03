import { getTrait, NFT, NftFactory } from './nft';

export type ExtractorTypes = {
  title?: TitleExtractorTypes
}

export enum TitleExtractorTypes {
  METADATA_NAME = 'metadata.name',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track',
  DEFAULT = ATTRIBUTES_TRAIT_TRACK
}

export type TitleExtractor = (nft: NFT) => string;
export type TitleExtractorMapping = Record<TitleExtractorTypes, TitleExtractor>

export const titleExtractors: TitleExtractorMapping = {
  'metadata.name': (nft: NFT) => nft.metadata.name,
  'attributes.trait.songTitle': (nft: NFT) => getTrait(nft, 'Song Title'),
  'attributes.trait.track': (nft: NFT) => getTrait(nft, 'Track')
}

export const titleExtractor = (contract?: NftFactory): TitleExtractor => {
  const titleExtractorOverride = contract?.typeMetadata?.overrides?.extractor?.title || '';
  const extractor = titleExtractorOverride ? titleExtractors[titleExtractorOverride] : titleExtractors[TitleExtractorTypes.DEFAULT];
  if (!extractor) {
    throw new Error('unknown extractor override provided')
  }
  return extractor
}
