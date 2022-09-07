import * as slugifyLibrary from 'slugify'

import { formatAddress } from '../types/address';
import { Chain } from '../types/nft';

export const slugify = (input: string) => slugifyLibrary.default(input, { lower: true, strict: true })

export const ethereumArtistId = (address: string): string => {
  return `${Chain.ETHEREUM}/${formatAddress(address)}`;
}

export const ethereumTrackId = (address: string, trackId: string): string => {
  const suffix = trackId !== '' ? `/${trackId}` : '';
  return ethereumArtistId(address) + suffix;
}
