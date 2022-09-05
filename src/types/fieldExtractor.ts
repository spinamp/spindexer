import { getTrait, NFT } from './nft';

export enum CustomFieldExtractor {
  METADATA_NAME = 'metadata.name',
  ATTRIBUTES_TRAIT_SONG_TITLE = 'attributes.trait.songTitle',
  ATTRIBUTES_TRAIT_TRACK = 'attributes.trait.track'
}

export const fieldExtractors: any = {
  'metadata.name': (nft: NFT) => nft.metadata.name,
  'attributes.trait.songTitle': (nft: NFT) => getTrait(nft, 'Song Title'),
  'attributes.trait.track': (nft: NFT) => getTrait(nft, 'Track')
}
