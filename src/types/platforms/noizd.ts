import _ from "lodash";
import { NOIZDClient } from "../../clients/noizd";
import { formatAddress } from "../address";
import { MusicPlatform } from "../platform";
import { ProcessedTrack, Track } from "../track";
import { isGif, isMP4 } from '../media';
import { ArtistProfile } from "../artist";

const mapTrackID = (trackId: string): string => {
  const [contractAddress, nftId] = trackId.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
};

const getNoizdVideoPosterUrl = (url: string) => {
  return url.substr(0, url.lastIndexOf('.')) + '.jpg';
};

const getNoizdResizedUrl = (src: string, size?: number | string): string => {
  if (!size || !src.startsWith('https://cf')) {
    return src;
  }

  const urlParts = src.split('/');
  const imageName = urlParts.pop();
  return [...urlParts, size, imageName].join('/');
};

const mapArtistID = (id: string) => `noizd/${id}`;

export const mapArtistProfile = (platformResponse: any, createdAtBlockNumber: string): ArtistProfile => {
  const artist = platformResponse.music.artist;
  return {
    name: artist.username,
    artistId: mapArtistID(artist.id),
    platformId: artist.id,
    platform: MusicPlatform.noizd,
    avatarUrl: artist.profile?.image_profile?.url,
    websiteUrl: `https://noizd.com/u/${artist.uri}`,
    createdAtBlockNumber,
  }
};

const mapTrack = (trackItem: {
  track: Track;
  platformTrackResponse?: any;
}): ProcessedTrack => {
  const { cover } = trackItem.platformTrackResponse.music;
  const artwork = isMP4(cover.mime)
    ? getNoizdVideoPosterUrl(cover.url)
    : isGif(cover.mime)
      ? getNoizdResizedUrl(cover.url, 450)
      : cover.url;

  return {
    id: mapTrackID(trackItem.track.id),
    platformId: trackItem.platformTrackResponse.music.id,
    title: trackItem.platformTrackResponse.music.title,
    platform: MusicPlatform.noizd,
    lossyAudioURL: trackItem.platformTrackResponse.metadata.audio_url,
    createdAtBlockNumber: trackItem.track.createdAtBlockNumber,
    lossyArtworkURL: artwork,
    websiteUrl: `https://noizd.com/assets/${trackItem.platformTrackResponse.music.id}`,
    artistId: mapArtistID(trackItem.platformTrackResponse.music.artist.id),
    artist: { id: mapArtistID(trackItem.platformTrackResponse.music.artist.id), name: trackItem.platformTrackResponse.music.artist.username }
  }
};

const getTokenIdFromTrack = (track: Track) => {
  return track.id.split('/')[1];
}

const addPlatformTrackData = async (tracks: Track[], client: NOIZDClient) => {
  const trackTokenIds = tracks.map(t => getTokenIdFromTrack(t));
  const platformTracks = await client.fetchNOIZDTracksForNFTs(trackTokenIds);
  const platformTrackDataByTokenId = _.keyBy(platformTracks, 'metadata.id');
  const platformTrackData: { track: Track, platformTrackResponse: any }[]
    = tracks.map(track => ({
      track,
      platformTrackResponse: platformTrackDataByTokenId[getTokenIdFromTrack(track)]
    }));
  return platformTrackData;
}


export default {
  addPlatformTrackData,
  mapTrack,
  mapArtistProfile,
}
