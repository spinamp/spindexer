import axios, { Axios, AxiosError } from 'axios';

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
  initialTrackCursor: string,
  getAPITrackCursor: (track: any) => string
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
        hidden: false,
      },
      $limit: 1,
    },
  });
  return data.items[0].created;
}

export const getTracksFrom = async (cursor: string): Promise<NOIZDAPITrack[]> => {
  const { data } = await noizdAPI.get('/music', {
    params: {
      $order: '[["created", "ASC"]]',
      $where: {
        '$artist.approved_artist$': { "$eq": true },
        created: { "$gt": cursor }
      },
      hidden: false,
      $limit: 100,
    },
  });
  return data.items;
}

const initialTrackCursor = '2020-04-07T21:11:16.494Z'

const getAPITrackCursor = (track: any) => {
  return track.created;
}


const init = async () => {
  return {
    fetchNFTs,
    fetchLatestTrackCursor,
    getTracksFrom,
    initialTrackCursor,
    getAPITrackCursor
  }
}

export default {
  init
};
