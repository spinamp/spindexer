import { slugify } from '../utils/identifiers';

import { formatAddress } from './address';
import { Record, TimeField } from './record'

export type Artist = Record & {
  name: string;
  slug: string;
}

export type ArtistProfile = TimeField & {
  platformInternalId: string;
  artistId: string;
  name: string;
  platformId: string;
  avatarUrl?: string;
  websiteUrl?: string;
}

export const mapArtist = (artistProfile: ArtistProfile): Artist => {
  return {
    name: artistProfile.name,
    slug: slugify(`${artistProfile.name} ${artistProfile.createdAtTime.getTime()}`),
    id: artistProfile.artistId,
    createdAtTime: artistProfile.createdAtTime,
    createdAtEthereumBlockNumber: artistProfile.createdAtEthereumBlockNumber
  }
};

export const createArtistIdFromEthereumAddress = (address: string) => {
  return `ethereum/${formatAddress(address)}`;
}
