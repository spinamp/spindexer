import _ from "lodash";
import { NOIZDAPITrack, NOIZDClient } from "../../clients/noizd";
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

export const mapArtistProfile = (platformResponse: any, createdAtTimestamp: string, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = platformResponse.artist;
  return {
    name: artist.username,
    artistId: mapArtistID(artist.id),
    platformId: artist.id,
    platform: MusicPlatform.noizd,
    avatarUrl: artist.profile?.image_profile?.url,
    websiteUrl: `https://noizd.com/u/${artist.uri}`,
    createdAtTimestamp,
    createdAtEthereumBlockNumber
  };
};

const mapAPITrackID = (apiTrackId: string): string => {
  return `noizd/${apiTrackId}`;
};

const mapAPITrackTimestamp = (apiTrack:any) => '' + new Date(apiTrack.created).getTime()

const mapAPITrack: (apiTrack: NOIZDAPITrack) => ProcessedTrack = (apiTrack: any) => {
  const { cover } = apiTrack;
  const artwork = isMP4(cover.mime)
    ? getNoizdVideoPosterUrl(cover.url)
    : isGif(cover.mime)
      ? getNoizdResizedUrl(cover.url, 450)
      : cover.url;

  return {
    id: mapAPITrackID(apiTrack.id),
    platformId: apiTrack.id,
    title: apiTrack.title,
    platform: MusicPlatform.noizd,
    lossyAudioURL: apiTrack.metadata ? apiTrack.metadata.audio_url : apiTrack.full.url,
    createdAtTimestamp: mapAPITrackTimestamp(apiTrack),
    lossyArtworkURL: artwork,
    websiteUrl: `https://noizd.com/assets/${apiTrack.id}`,
    artistId: mapArtistID(apiTrack.artist.id),
    artist: { id: mapArtistID(apiTrack.artist.id), name: apiTrack.artist.username }
  }
}

const mapTrack = (trackItem: {
  track: Track;
  platformTrackResponse?: any;
}): ProcessedTrack => {
  const processedTrack = mapAPITrack(trackItem.platformTrackResponse);
  if (!trackItem.track) {
    return processedTrack;
  }
  return {
    ...processedTrack,
    id: mapTrackID(trackItem.track.id),
    lossyAudioURL: trackItem.platformTrackResponse.metadata.audio_url,
    createdAtTimestamp: processedTrack.createdAtTimestamp || trackItem.track.createdAtTimestamp,
    createdAtEthereumBlockNumber: trackItem.track.createdAtEthereumBlockNumber,
  };
};

const getTokenIdFromTrack = (track: Track) => {
  return track.id.split('/')[1];
}

const addPlatformTrackData = async (tracks: Track[], client: NOIZDClient) => {
  const trackTokenIds = tracks.map(t => getTokenIdFromTrack(t));
  const platformNFTs = await client.fetchNFTs(trackTokenIds);
  const platformTracks = platformNFTs.map(nft => ({ ...nft.music, metadata: nft.metadata }));
  const platformTrackByTokenId = _.keyBy(platformTracks, 'metadata.id');
  const platformTrackData: { track: Track, platformTrackResponse: any }[]
    = tracks.map(track => ({
      track,
      platformTrackResponse: platformTrackByTokenId[getTokenIdFromTrack(track)]
    }));
  return platformTrackData;
}

export default {
  addPlatformTrackData,
  mapAPITrackTimestamp,
  mapAPITrack,
  mapTrack,
  mapArtistProfile,
}
