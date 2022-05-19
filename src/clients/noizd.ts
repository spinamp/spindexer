import axios from 'axios';
import slugify from 'slugify';

import { formatAddress } from '../types/address';
import { isGif, isMP4 } from '../types/media';
import { ProcessedTrack } from '../types/track';

const noizdAPI = axios.create({
  timeout: 10000,
  baseURL: 'https://api-prod.noizd.com/api/v1/',
});

export type NOIZDAPINFT = any;
export type NOIZDAPITrack = any;

export type NOIZDClient = {
  fetchNFTs: (nftIds: string[]) => Promise<NOIZDAPINFT[]>;
  fetchLatestTrackCursor: () => Promise<string>;
  getTracksFrom: (cursor: string) => Promise<NOIZDAPITrack[]>;
  fetchTracksByTrackId: (trackIds: string[]) => Promise<any[]>;
  getAPITrackCursor: (track: any) => string
}

const mapAPITrackToTrackID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.metadata.contract)}/${apiTrack.metadata.id}`;
};

const mapAPIIDToTrackId = (apiTrackId: string): string => {
  return `noizd/${apiTrackId}`;
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

export const mapAPITrackTime = (apiTrack: any) => new Date(apiTrack.created)

export const mapAPITrackToArtistID = (apiTrack: any) => `noizd/${apiTrack.artist.id}`;

export const mapAPITrack: (apiTrack: NOIZDAPITrack) => ProcessedTrack = (apiTrack: any) => {
  const { cover } = apiTrack;
  const artwork = isMP4(cover.mime)
    ? getNoizdVideoPosterUrl(cover.url)
    : isGif(cover.mime)
      ? getNoizdResizedUrl(cover.url, 450)
      : cover.url;

  return {
    id: mapAPIIDToTrackId(apiTrack.id),
    platformInternalId: apiTrack.id,
    title: apiTrack.title,
    slug: slugify(`${apiTrack.title} ${mapAPITrackTime(apiTrack).getTime()}`).toLowerCase(),
    description: apiTrack.description,
    platformId: 'noizd',
    lossyAudioURL: apiTrack.metadata ? apiTrack.metadata.audio_url : apiTrack.full.url,
    createdAtTime: mapAPITrackTime(apiTrack),
    lossyArtworkURL: artwork,
    websiteUrl: `https://noizd.com/assets/${apiTrack.id}`,
    artistId: mapAPITrackToArtistID(apiTrack),
  }
}


const fetchNFTs = async (
  nftIds: string[],
): Promise<NOIZDAPINFT[]> => {
  const { data } = await noizdAPI.get('/nft', {
    params: {
      $order: '[["created", "DESC"]]',
      $where: `{ "metadata.id": { "$in": ${JSON.stringify(nftIds)} } }`,
      $limit: 100,
    },
  });
  return data.items;
};

export const fetchLatestTrackCursor = async (): Promise<string> => {
  const { data } = await noizdAPI.get('/music', {
    params: {
      $order: '[["created", "DESC"]]',
      $where: {
        '$artist.approved_artist$': { $eq: true },
        'hidden': { '$eq': false },
      },
      $limit: 1,
    },
  });
  return data.items[0].created;
}

export const getTracksFrom = async (cursor: string): Promise<NOIZDAPITrack[]> => {
  const createdUTC = new Date(parseInt(cursor)).toISOString()
  const { data } = await noizdAPI.get('/music', {
    params: {
      $order: '[["created", "ASC"]]',
      $where: {
        '$artist.approved_artist$': { '$eq': true },
        'hidden': { '$eq': false },
        'created': { '$gt': createdUTC }
      },
      hidden: false,
      $limit: 20,
    },
  });
  return data.items;
}

const getAPITrackCursor = (track: any) => {
  return '' + new Date(track.created).getTime();
}

export const mapTrackIdToNFTId = (id: string) => {
  const [chain, contractAddress, nftId] = id.split('/');
  return nftId;
}

const fetchTracksByTrackId = async (trackIds: string[]) => {
  const nftIds = trackIds.map(i => mapTrackIdToNFTId(i));
  const apiNFTs = await fetchNFTs(nftIds);
  const apiTracks = apiNFTs.map(apiNFT => ({
    ...apiNFT.music,
    metadata: apiNFT.metadata,
    trackId: mapAPITrackToTrackID(apiNFT),
  }))
  return apiTracks;
}

const init = async () => {
  return {
    fetchNFTs,
    fetchLatestTrackCursor,
    getTracksFrom,
    getAPITrackCursor,
    fetchTracksByTrackId,
    mapAPITrack
  }
}

export default {
  init
};
