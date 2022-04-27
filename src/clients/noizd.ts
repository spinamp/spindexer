import axios from 'axios';

import { formatAddress } from '../types/address';

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
    fetchTracksByTrackId
  }
}

export default {
  init
};
