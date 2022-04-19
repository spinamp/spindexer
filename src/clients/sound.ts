import { gql, GraphQLClient } from 'graphql-request';

const soundAPI = new GraphQLClient(
  'https://api.sound.xyz/graphql',
);

export type SoundClient = {
  getAllMintedReleases: () => Promise<any[]>;
  audioFromTrack: (trackId: string) => Promise<any>;
}

const init = async () => {
  return {
    audioFromTrack: async (trackId: string): Promise<any> => {
      const respose = await soundAPI.request(
        gql`
        {
          audioFromTrack(trackId:"${trackId}") {
            audio {
                id
                url
                key
            }
            duration
            }
          }
        `
      );
      return respose.audioFromTrack.audio;
    },
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
