import _ from "lodash";
import slugify from "slugify";
import { DBClient } from "../db/db";
import { MusicPlatform } from "./platform";
import { Record, Timestamp } from "./record"

export type Artist = Record & {
  name: string;
  slug: string;
}

export type ArtistProfile = Timestamp & {
  platformInternalId: string;
  artistId: string;
  name: string;
  platformId: MusicPlatform;
  avatarUrl?: string;
  websiteUrl?: string;
}

export const mapArtist = (artistProfile: ArtistProfile): Artist => {
  return {
    name: artistProfile.name,
    slug: slugify(`${artistProfile.name} ${artistProfile.createdAtTimestamp}`).toLowerCase(),
    id: artistProfile.artistId,
    createdAtTimestamp: artistProfile.createdAtTimestamp,
    createdAtEthereumBlockNumber: artistProfile.createdAtEthereumBlockNumber
  }
};
