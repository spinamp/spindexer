import { gql, GraphQLClient } from 'graphql-request';
import _ from 'lodash';

import { formatAddress } from '../types/address';
import { mapTrackIdToContractAddress, mapTrackIdToNFTId } from '../types/platforms/catalog';

const catalogApi = new GraphQLClient(
  'https://catalog-prod.hasura.app/v1/graphql',
);

const mapAPITrackToTrackID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.contract_address)}/${apiTrack.nft_id}`;
};

export type CatalogClient = {
  fetchTracksByTrackId: (trackIds: string[]) => Promise<any[]>;
}

const getTracksByNFTIdQuery = (contractAddress: string, nftIDs: string) => {
  return gql`
  {
    tracks(where: {nft_id: {_in: ${nftIDs}}, _and: {contract_address: {_eq: ${contractAddress}}} }) {
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
      const trackIdsByContract = _.groupBy(trackIds, id => mapTrackIdToContractAddress(id))
      const nftIdsByContract = _.mapValues(trackIdsByContract, contractTrackIds =>
        JSON.stringify(contractTrackIds.map(id => mapTrackIdToNFTId(id))))
      const queries = _.map(nftIdsByContract, (contractAddress, nfts) => getTracksByNFTIdQuery(contractAddress, nfts));
      console.log({ queries });
      process.exit(0);
      const responses = queries.map(async query => (await catalogApi.request(query)).tracks);
      const tracks = _.flatten(await responses);
      const apiTracks = tracks.map(apiTrack => ({
        ...apiTrack,
        trackId: mapAPITrackToTrackID(apiTrack),
      }))
      const filteredAPITracks = apiTracks.filter(apiTrack => trackIds.includes(apiTrack.trackId));
      console.log({ filteredAPITracks })

      return filteredAPITracks;
    }
  }
}

export default {
  init
};
