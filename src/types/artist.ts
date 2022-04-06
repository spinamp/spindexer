import slugify from "slugify";
import { MusicPlatform } from "./platform";

export type Artist = {
  id: string;
  name: string;
  slug: string;
  profiles: {
    [platform in MusicPlatform]?: ArtistProfile;
  };
  createdAtBlockNumber: string;
}

export type ArtistProfile = {
  platformId: string;
  artistId: string;
  name: string;
  platform: MusicPlatform;
  avatarUrl?: string;
  websiteUrl?: string;
  createdAtBlockNumber: string;
}

export const mapArtist = (artistProfile: ArtistProfile, platform: MusicPlatform): Artist => {
  return {
    name: artistProfile.name,
    slug: slugify(`${artistProfile.name} ${artistProfile.createdAtBlockNumber}`).toLowerCase(),
    id: artistProfile.artistId,
    profiles: {
      [platform]: artistProfile
    },
    createdAtBlockNumber: artistProfile.createdAtBlockNumber,
  }
};
