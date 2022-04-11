import _ from "lodash";
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
  platformId: trackItem.platformTrackResponse.id,
  title: trackItem.platformTrackResponse.title,
  platform: MusicPlatform.sound,
  lossyAudioURL: trackItem.platformTrackResponse.tracks[0]?.audio?.url,
  createdAtTimestamp: trackItem.track.createdAtTimestamp,
  createdAtEthereumBlockNumber: trackItem.track.createdAtEthereumBlockNumber,
  lossyArtworkURL: trackItem.platformTrackResponse.coverImage?.url,
  websiteUrl:
    trackItem.platformTrackResponse.artist.soundHandle && trackItem.platformTrackResponse.titleSlug
      ? `https://www.sound.xyz/${trackItem.platformTrackResponse.artist.soundHandle}/${trackItem.platformTrackResponse.titleSlug}`
      : 'https://www.sound.xyz',
  artistId: mapArtistID(trackItem.platformTrackResponse.artist.user.publicAddress),
  artist: { id: mapArtistID(trackItem.platformTrackResponse.artist.user.publicAddress), name: trackItem.platformTrackResponse.artist.name }
});

export const mapArtistProfile = (platformResponse: any, createdAtTimestamp: bigint, createdAtEthereumBlockNumber?: bigint): ArtistProfile => {
  const artist = platformResponse.artist
  return {
    name: artist.name,
    artistId: mapArtistID(artist.user.publicAddress),
    platformId: artist.id,
    platform: MusicPlatform.sound,
    avatarUrl: artist.user?.avatar?.url,
    websiteUrl: artist.soundHandle ?
      `https://www.sound.xyz/${artist.soundHandle}`
      : 'https://www.sound.xyz',
    createdAtTimestamp,
    createdAtEthereumBlockNumber
  }
};

const addPlatformTrackData = async (tracks: Track[], client: SoundClient) => {
  const platformTracks = await client.getAllMintedReleases();
  const platformTracksWithTrackID = platformTracks.map(platformTrack => ({
    ...platformTrack,
    id: `${formatAddress(platformTrack?.artist?.contract?.address)}/${platformTrack?.mintInfo?.editionId}`,
  }));
  const platformTrackDataByTrackId = _.keyBy(platformTracksWithTrackID, 'id');
  const platformTrackData: { track: Track, platformTrackResponse: any }[]
    = tracks.map(track => ({ track, platformTrackResponse: platformTrackDataByTrackId[track.id] }));
  return platformTrackData;
}

export default {
  addPlatformTrackData,
  mapTrack,
  mapArtistProfile,
}
