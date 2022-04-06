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
