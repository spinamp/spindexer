import _ from "lodash";
import slugify from "slugify";
import { SoundClient } from "../../clients/sound";
import { formatAddress } from "../address";
import { ArtistProfile } from "../artist";
import { MusicPlatform } from "../platform";
import { Track, ProcessedTrack } from "../track";

const mapTrackID = (trackId: string): string => {
  const [contractAddress, editionId] = trackId.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${editionId}`;
};

const mapArtistID = (artistId: string): string => {
  return `ethereum/${formatAddress(artistId)}`;
};

const mapTrack = (trackItem: {
  track: Track;
  platformTrackResponse: any;
}): ProcessedTrack => ({
  id: mapTrackID(trackItem.track.id),
  platformInternalId: trackItem.platformTrackResponse.id,
  title: trackItem.platformTrackResponse.title,
  slug: slugify(`${trackItem.platformTrackResponse.title} ${trackItem.track.createdAtTime.getTime()}`).toLowerCase(),
  description: trackItem.platformTrackResponse.description,
  platformId: MusicPlatform.sound,
  lossyAudioURL: trackItem.platformTrackResponse.tracks[0]?.audio?.url,
  createdAtTime: trackItem.track.createdAtTime,
  createdAtEthereumBlockNumber: trackItem.track.createdAtEthereumBlockNumber,
  lossyArtworkURL: trackItem.platformTrackResponse.coverImage?.url,
  websiteUrl:
    trackItem.platformTrackResponse.artist.soundHandle && trackItem.platformTrackResponse.titleSlug
      ? `https://www.sound.xyz/${trackItem.platformTrackResponse.artist.soundHandle}/${trackItem.platformTrackResponse.titleSlug}`
      : 'https://www.sound.xyz',
  artistId: mapArtistID(trackItem.platformTrackResponse.artist.user.publicAddress),
});

export const mapArtistProfile = (platformResponse: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = platformResponse.artist
  return {
    name: artist.name,
    artistId: mapArtistID(artist.user.publicAddress),
    platformInternalId: artist.id,
    platformId: MusicPlatform.sound,
    avatarUrl: artist.user?.avatar?.url,
    websiteUrl: artist.soundHandle ?
      `https://www.sound.xyz/${artist.soundHandle}`
      : 'https://www.sound.xyz',
    createdAtTime,
    createdAtEthereumBlockNumber
  }
};

const addPlatformTrackData = async (tracks: Track[], client: SoundClient) => {
  const platformTracks = await client.getAllMintedReleases();
  const platformTracksWithTrackID = platformTracks.map(platformTrack => ({
    ...platformTrack,
    trackId: `${formatAddress(platformTrack?.artist?.contract?.address)}/${platformTrack?.mintInfo?.editionId}`,
  }));
  const platformTrackDataByTrackId = _.keyBy(platformTracksWithTrackID, 'trackId');
  const platformTrackData: { track: Track, platformTrackResponse: any }[]
    = tracks.map(track => ({ track, platformTrackResponse: platformTrackDataByTrackId[track.id] }));
  return platformTrackData;
}

export default {
  addPlatformTrackData,
  mapTrack,
  mapArtistProfile,
}
