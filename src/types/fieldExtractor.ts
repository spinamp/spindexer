import { getTrait, NFT, NftFactory } from './nft';

export type ExtractorTypes = {
  title?: TitleExtractorTypes
  id?: IdExtractorTypes
}

export enum TitleExtractorTypes {
  METADATA_NAME = 'metadata.name',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track',
}

export enum IdExtractorTypes {
  USE_TITLE_EXTRACTOR = 'useTitleExtractor',
}

export type Extractor = (nft: NFT) => string;
export type TitleExtractorMapping = Record<TitleExtractorTypes, Extractor>

export const titleExtractors: TitleExtractorMapping = {
  'metadata.name': (nft: NFT) => nft.metadata.name,
  'attributes.trait.songTitle': (nft: NFT) => getTrait(nft, 'Song Title'),
  'attributes.trait.track': (nft: NFT) => getTrait(nft, 'Track')
}

export const titleExtractor = (contract: NftFactory): Extractor => {
  const titleExtractorOverride = contract.typeMetadata?.overrides?.extractor?.title;
  if (!titleExtractorOverride) {
    throw new Error('unknown extractor override provided')
  }
  return titleExtractors[titleExtractorOverride];
}

export const idExtractor = (contract: NftFactory): Extractor | undefined => {
  const idExtractorOverride = contract.typeMetadata?.overrides?.extractor?.id;
  if (!idExtractorOverride) {
    return undefined;
  }

  if (idExtractorOverride === IdExtractorTypes.USE_TITLE_EXTRACTOR) {
    return titleExtractor(contract);
  }

  throw new Error('no other options just yet')
}
