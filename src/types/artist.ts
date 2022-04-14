import _ from "lodash";
import slugify from "slugify";
import { DBClient } from "../db/db";
import { MusicPlatform } from "./platform";
import { Record, Timestamp } from "./record"

export type Artist = Record & {
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
  return {
    name: artistProfile.name,
    slug: slugify(`${artistProfile.name} ${artistProfile.createdAtTimestamp}`).toLowerCase(),
    id: artistProfile.artistId,
    profiles: {
      [platform]: artistProfile
    },
    createdAtTimestamp: artistProfile.createdAtTimestamp,
    createdAtEthereumBlockNumber: artistProfile.createdAtEthereumBlockNumber
  }
};

// Merge a batch of potentially new artists and potentially new profiles with existing ones from the DB
export const mergeInExistingArtist = async (artists: Artist[], dbClient: DBClient): Promise<Artist[]> => {
  const existingArtistIds = artists.map(a => a.id);
  const existingArtists = await dbClient.getRecords<Artist>('artists', [
    ['whereIn', [{ id: existingArtistIds }]]
  ]);
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
