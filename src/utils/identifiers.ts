import * as slugifyLibrary from 'slugify'

import { formatAddress } from '../types/address';
import { idExtractor } from '../types/fieldExtractor';
import { NFT, NftFactory } from '../types/nft';

export const slugify = (input: string) => slugifyLibrary.default(input, { lower: true, strict: true })

export const ethereumTrackId = (nft: NFT, contract: NftFactory): string => {
  const extractor = idExtractor(contract)
  const trackId = slugify(extractor(nft));
  if (!trackId) {
    throw new Error('ID not extracted correctly');
  }
  return `ethereum/${formatAddress(nft.contractAddress)}/${trackId}`;
}
