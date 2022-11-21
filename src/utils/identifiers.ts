import { isAddress } from 'ethers/lib/utils';
import * as slugifyLibrary from 'slugify'

import { formatAddress } from '../types/address';
import { ChainId } from '../types/chain';
import { NftFactory } from '../types/nft';

export const slugify = (input: string) => slugifyLibrary.default(input, { lower: true, strict: true })

export const artistId = (chainId: ChainId, address: string): string => {
  // hardcode evm ids to ethereum to produce consistent ids across chains
  return chainId === ChainId.solana ? solanaArtistId(address) : evmId(ChainId.ethereum, address)
}

export const trackId = (contract: NftFactory, address: string, id: string): string => {
  return contract.chainId === ChainId.solana ? solanaTrackId(address, id) : evmTrackId(contract.chainId, address, id)
}

export const evmId = (chainId: ChainId, address: string): string => {
  return `${chainId}/${formatAddress(address)}`;
}

export const evmTrackId = (chainId: ChainId, address: string, id: string): string => {
  const suffix = id !== '' ? `/${id}` : '';
  return evmId(chainId, address) + suffix;
}

export const transferId = (chainId: ChainId, blockNumber: string | number, logIndex: string | number): string => {
  return `${chainId}/${blockNumber}/${logIndex}`;
}

export const solanaArtistId = (address: string): string => {
  return address;
}

export const solanaId = (address: string): string => {
  return `${ChainId.solana}/${address}`;
}

export const solanaTrackId = (address: string, id: string): string => {
  const suffix = id !== '' ? `/${id}` : '';
  return solanaId(address) + suffix;
}

export const ethereumAddressFromId = (id: string): string | undefined => {
  if (id === undefined) { return; }

  if (isAddress(id)) {
    return id
  }

  const parts = id.split('/');
  if (parts[1] && isAddress(parts[1])) {
    return parts[1];
  }
}
