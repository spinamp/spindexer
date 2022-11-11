import { slugify } from '../utils/identifiers';

import { Record, TimeField } from './record'

export type Artist = Record & {
  name: string;
  address?: string;
  avatarUrl?: string;
  externalLinks: any[]; // TODO: build out a TS type with name: string, type: string, link: string
  theme: any[]; // TODO: check for an existing TS type or define one
  spinampLayoutConfig: any[]; // TODO build out a TS type for type: string, data: string, visible: boolean
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

export const mapArtist = (artistProfile: ArtistProfile): Partial<Artist> => {
  return {
    id: artistProfile.artistId,
    name: artistProfile.name,
    address: '', // TODO: resolve from earliest profile's artistId, if available
    avatarUrl: artistProfile.avatarUrl,
    slug: slugify(`${artistProfile.name} ${artistProfile.createdAtTime.getTime()}`),
    createdAtTime: artistProfile.createdAtTime,
    createdAtEthereumBlockNumber: artistProfile.createdAtEthereumBlockNumber
  }
};
