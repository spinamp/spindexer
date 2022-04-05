import { MusicPlatform } from "./platform";

export type Artist = {
  id: string;
  name: string;
  profiles: {
    [platform in MusicPlatform]?: ArtistProfile;
  };
}

export type ArtistProfile = {
  platformId: string;
  artistId: string;
  name: string;
  platform: MusicPlatform;
  avatarUrl?: string;
  websiteUrl?: string;
}
