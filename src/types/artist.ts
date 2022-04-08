import _ from "lodash";
import slugify from "slugify";
import { DBClient } from "../db/db";
import { MusicPlatform } from "./platform";
import { Record, Timestamp } from "./record"

export type Artist = Record & {
  id: string;
  name: string;
  slug: string;
  profiles: {
    [platform in MusicPlatform]?: ArtistProfile;
  };
}

export type ArtistProfile = Timestamp & {
  platformId: string;
  artistId: string;
  name: string;
  platform: MusicPlatform;
  avatarUrl?: string;
  websiteUrl?: string;
}

export const mapArtist = (artistProfile: ArtistProfile, platform: MusicPlatform): Artist => {
  let created;
  if ((artistProfile as any).createdAtBlockNumber) {
    created = { createdAtBlockNumber: (artistProfile as any).createdAtBlockNumber }
  } else {
    created = { createdAtTime: (artistProfile as any).createdAtTime }
  }
  return {
    name: artistProfile.name,
    slug: slugify(`${artistProfile.name} ${created}`).toLowerCase(),
    id: artistProfile.artistId,
    profiles: {
      [platform]: artistProfile
    },
    ...created
  }
};

// Merge a batch of potentially new artists and potentially new profiles with existing ones from the DB
export const mergeInExistingArtist = async (artists: Artist[], dbClient: DBClient): Promise<Artist[]> => {
  const existingArtistsQuery = { where: artists.map(a => ({ key: 'id', value: a.id })), whereType: 'or' };
  const existingArtists = await dbClient.getRecords<Artist>('artists', existingArtistsQuery);
  const existingArtistsById = _.keyBy(existingArtists, 'id');
  const mergedArtists = artists.map(artist => {
    const existingArtist = existingArtistsById[artist.id];
    if (existingArtist) {
      const mergedProfiles = Object.assign({}, artist.profiles, existingArtist.profiles);
      return Object.assign({}, artist, existingArtist, {
        profiles: mergedProfiles
      });
    }
    return artist;
  });
  return mergedArtists;
}
