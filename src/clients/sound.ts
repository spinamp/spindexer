import { gql, GraphQLClient } from 'graphql-request';

import { formatAddress } from '../types/address';

const soundAPI = new GraphQLClient(
  'https://api.sound.xyz/graphql',
);

const mapAPITrackToTrackID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack?.artist?.contract?.address)}/${apiTrack?.mintInfo?.editionId}`
};

export type SoundClient = {
  fetchTracksByTrackId: (trackIds: string[]) => Promise<any[]>;
  audioFromTrack: (trackId: string) => Promise<any>;
}

const init = async () => {
  const audioFromTrack = async (trackId: string): Promise<any> => {
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
  };
  const getAllMintedReleasesFunction = async (
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
  };
  const fetchTracksByTrackId = async (trackIds: string[]) => {
    const apiResponse = await getAllMintedReleasesFunction();
    const apiTracks = apiResponse.map(apiTrack => ({
      ...apiTrack,
      trackId: mapAPITrackToTrackID(apiTrack),
    }))
    const filteredAPITracks = apiTracks.filter(apiTrack => trackIds.includes(apiTrack.trackId));
    filteredAPITracks.forEach(apiTrack => {
      if(apiTrack.tracks.length > 1) {
        return { isError: true, error: new Error('Sound release with multiple tracks not yet implemented') };
      }
    });
    const audioAPITrackPromises = filteredAPITracks.map(async apiTrack => {
      return {
        ...apiTrack,
        tracks: [{
          ...apiTrack.tracks[0],
          audio: await audioFromTrack(apiTrack.tracks[0].id),
        }]
      };
    });
    const audioAPITracks = await Promise.all(audioAPITrackPromises);
    return audioAPITracks;
  };
  return {
    audioFromTrack,
    getAllMintedReleases: getAllMintedReleasesFunction,
    fetchTracksByTrackId
  };
}

export default {
  init
};
