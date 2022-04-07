import { gql, GraphQLClient } from 'graphql-request';

const soundAPI = new GraphQLClient(
  'https://api.sound.xyz/graphql',
);

export type SoundClient = {
  getAllMintedReleases: () => Promise<any[]>;
}

const init = async () => {
  return {
    getAllMintedReleases: async (
    ): Promise<any[]> => {
      const { getAllMintedReleases } = await soundAPI.request(
        gql`
          {
            getAllMintedReleases {
                id
                createdAt
                title
                titleSlug
                description
                mintInfo {
                editionId
                }
                coverImage {
                id
                url
                }
                artist {
                id
                name
                soundHandle
                contract {
                    address
                }
                user {
                    publicAddress
                    avatar {
                    url
                    }
                }
                }
                tracks {
                id
                title
                trackNumber
                audio {
                    id
                    url
                    key
                }
                duration
                }
            }
        }
        `,
      );
      return getAllMintedReleases;
    }
  }
}

export default {
  init
};
