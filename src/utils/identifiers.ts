import * as slugifyLibrary from 'slugify'

import { formatAddress } from '../types/address';
import { Chain, NftFactory, NFTStandard } from '../types/nft';

export const slugify = (input: string) => slugifyLibrary.default(input, { lower: true, strict: true })

export const artistId = (contract: NftFactory, address: string): string => {
  return contract.standard === NFTStandard.METAPLEX ? solanaId(address) : ethereumId(address)
}

export const trackId = (contract: NftFactory, address: string, id: string): string => {
  return contract.standard === NFTStandard.METAPLEX ? solanaTrackId(address, id) : ethereumTrackId(address, id)
}

export const ethereumId = (address: string): string => {
  return `${Chain.ETHEREUM}/${formatAddress(address)}`;
}

export const ethereumTrackId = (address: string, id: string): string => {
  const suffix = id !== '' ? `/${id}` : '';
  return ethereumId(address) + suffix;
}

export const ethereumTransferId = (blockNumber: string | number, logIndex: string | number): string => {
  return `${Chain.ETHEREUM}/${blockNumber}/${logIndex}`;
}

export const solanaId = (address: string): string => {
  return `${Chain.SOLANA}/${formatAddress(address)}`;
}

export const solanaTrackId = (address: string, id: string): string => {
  const suffix = id !== '' ? `/${id}` : '';
  return solanaId(address) + suffix;
}