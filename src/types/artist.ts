import { slugify } from '../utils/identifiers';

import { Record, TimeField } from './record'

enum SupportedExternalLinkTypes { 'facebook', 'twitter', 'instagram', 'soundcloud', 'bandcamp', 'spotify', 'itunes', 'deezer', 'tidal', 'discord', 'telegram', 'website' }

type ExternalLink = {
  name?: string,
  type: SupportedExternalLinkTypes,
  url: string,
}

export type Artist = Record & {
  name: string;
  address?: string;
  avatarUrl?: string;
  externalLinks?: ExternalLink[];
  theme?: any;
  spinampLayoutConfig?: any;
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
    id: artistProfile.artistId,
    name: artistProfile.name,
    address: '', // TODO: resolve from earliest profile's artistId, if available
    avatarUrl: artistProfile.avatarUrl,
    slug: slugify(`${artistProfile.name} ${artistProfile.createdAtTime.getTime()}`),
    createdAtTime: artistProfile.createdAtTime,
    createdAtEthereumBlockNumber: artistProfile.createdAtEthereumBlockNumber
  }
};
