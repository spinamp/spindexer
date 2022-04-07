import axios, { Axios, AxiosError } from 'axios';

const noizdAPI = axios.create({
  timeout: 10000,
  baseURL: 'https://api-prod.noizd.com/api/v1/',
});

export type NOIZDClient = {
  fetchNOIZDTracksForNFTs: (nftIds: string[]) => Promise<any[]>;
}

const fetchNOIZDTracksForNFTs = async (
  nftIds: string[],
): Promise<any> => {
  const { data } = await noizdAPI.get('/nft', {
    params: {
      $order: '[["created", "DESC"]]',
      $where: `{ "metadata.id": { "$in": ${JSON.stringify(nftIds)} } }`,
      $limit: 100,
    },
  });
  return data.items;
};


const init = async () => {
  return {
    fetchNOIZDTracksForNFTs
  }
}

export default {
  init
};
