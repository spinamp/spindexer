import { gql, GraphQLClient } from 'graphql-request';

const catalogApi = new GraphQLClient(
  'https://catalog-prod.hasura.app/v1/graphql',
);

export type CatalogClient = {
  fetchCatalogTracksByNFT: (nftIds: string[]) => Promise<any[]>;
}

const init = async () => {
  return {
    fetchCatalogTracksByNFT: async (
      nftIds: string[],
    ): Promise<any[]> => {
      const nftIdsForQuery = JSON.stringify(nftIds);
      const { tracks } = await catalogApi.request(
        gql`
          {
            tracks(where: {nft_id: {_in: ${nftIdsForQuery}}}) {
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
          }
        `,
      );
      return tracks;
    }
  }
}

export default {
  init
};
