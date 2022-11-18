import { utils } from 'ethers';
import { gql, GraphQLClient } from 'graphql-request';
import _ from 'lodash';

import { ChainId } from '../types/chain';
import { evmTrackId } from '../utils/identifiers';

const catalogApi = new GraphQLClient(
  'https://catalog-prod.hasura.app/v1/graphql',
);

const mapAPITrackToTrackID = (apiTrack: any): string => {
  return evmTrackId(ChainId.ethereum, apiTrack.contract_address, apiTrack.nft_id);
};

export const mapTrackIdToNFTId = (id: string) => {
  const [chain, contractAddress, nftId] = id.split('/');
  return nftId;
}

export const mapTrackIdToContractAddress = (id: string) => {
  const [chain, contractAddress, nftId] = id.split('/');
  return contractAddress;
}

export type CatalogClient = {
  fetchTracksByTrackId: (trackIds: string[]) => Promise<any[]>;
}

const getTracksByNFTIdQuery = (contractAddress: string, nftIDs: string) => {
  return gql`
  {
    tracks(where: {nft_id: {_in: ${nftIDs}}, _and: {contract_address: {_eq: "${contractAddress}"}} }) {
      title
      contract_address
      nft_id
      description
      id
      ipfs_hash_lossy_audio
      ipfs_hash_lossy_artwork
      created_at
      short_url
      artist {
          handle
          description
          name
          id
          picture_uri
          links {
              type
              url
          }
      }
    }
  }`
};

const init = async () => {
  return {
    fetchTracksByTrackId: async (
      trackIds: string[],
    ): Promise<any[]> => {
      const trackIdsByContract = _.groupBy(trackIds, id => utils.getAddress(mapTrackIdToContractAddress(id)));
      const nftIdsByContract = _.mapValues(trackIdsByContract, contractTrackIds =>
        JSON.stringify(contractTrackIds.map(id => mapTrackIdToNFTId(id))))
      const queries = _.map(nftIdsByContract, (nfts, contractAddress) => getTracksByNFTIdQuery(contractAddress, nfts));
      const responses = queries.map(async query => (await catalogApi.request(query)).tracks);
      const tracks = _.flatten(await Promise.all(responses));
      const apiTracks = tracks.map(apiTrack => ({
        ...apiTrack,
        trackId: mapAPITrackToTrackID(apiTrack),
      }))
      const filteredAPITracks = apiTracks.filter(apiTrack => trackIds.includes(apiTrack.trackId));
      return filteredAPITracks;
    }
  }
}

export default {
  init
};
