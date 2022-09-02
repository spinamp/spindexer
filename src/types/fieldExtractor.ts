import { getTrait, NFT, NftFactory } from './nft';

export type TitleExtractor = (nft: NFT) => string;

export enum CustomTitleExtractor {
  METADATA_NAME = 'metadata.name',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track',
  DEFAULT = ATTRIBUTES_TRAIT_TRACK
}

export const titleExtractors: any = {
  'metadata.name': (nft: NFT) => nft.metadata.name,
  'attributes.trait.songTitle': (nft: NFT) => getTrait(nft, 'Song Title'),
  'attributes.trait.track': (nft: NFT) => getTrait(nft, 'Track')
}

export const titleExtractor = (nft: NFT, contract?: NftFactory): string => {
  const titleExtractorOverride = contract?.typeMetadata?.overrides?.extractor?.title || '';
  const extractor = titleExtractorOverride ? titleExtractors[titleExtractorOverride] : titleExtractors[CustomTitleExtractor.DEFAULT];
  if (!extractor) {
    throw new Error('unknown extractor override provided')
  }
  return extractor(nft)
}

export const titleExtractorFunction = (contract: NftFactory): string => {
  const titleExtractorOverride = contract?.typeMetadata?.overrides?.extractor?.title || '';
  const extractor = titleExtractorOverride ? titleExtractors[titleExtractorOverride] : titleExtractors[CustomTitleExtractor.DEFAULT];
  if (!extractor) {
    throw new Error('unknown extractor override provided')
  }
  return extractor
}
