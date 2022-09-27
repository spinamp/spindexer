import { gql, GraphQLClient } from 'graphql-request';

import { formatAddress } from '../types/address';
import { NFT } from '../types/nft';
import { ethereumTrackId } from '../utils/identifiers';

const clientKey = process.env.SOUND_XYZ_KEY;
if (!clientKey) {
  throw 'No SoundXYZ API key configured'
}

const soundAPI = new GraphQLClient(
  'https://api.sound.xyz/graphql',
  { headers: { 'x-sound-client-key': clientKey } }
);

const mapAPITrackToTrackID = (apiTrack: any): string => {
  if (!apiTrack) {
    throw new Error('Missing sound.xyz api track');
  }
  if (!apiTrack.artist || !apiTrack.artist.artistContractAddress) {
    throw new Error('Missing sound.xyz api track artist');
  }
  if (!apiTrack.editionId) {
    throw new Error('Missing sound.xyz api track editionId');
  }
  return ethereumTrackId(apiTrack.artist.artistContractAddress, apiTrack.editionId);
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
    const { allMintedReleases } = await soundAPI.request(
      gql`
        {
          allMintedReleases {
              id
              createdAt
              title
              titleSlug
              description
              editionId
              coverImage {
                id
                url
              }
              artist {
                id
                name
                soundHandle
                artistContractAddress
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
    return allMintedReleases.filter((release: any) => !!release.editionId);
  };

  const getNFTTitle = (nft: NFT) => {
    if (!nft.metadata) {
      console.error({ nft })
      throw new Error('Missing nft metadata');
    }
    if (nft.metadata.title){
      return nft.metadata.title;
    }
    if (!nft.metadata.name) {
      console.error({ nft })
      throw new Error('Missing name');
    }
    const splitName = nft.metadata.name.split('#');
    if (splitName.length !== 2) {
      console.error({ nft })
      throw new Error('Name split by # failed');
    }
    return splitName[0].trim();
  }


  const nftMatchesTrack = (nft: NFT, apiTrack: any) => {
    const sameArtistAsNFT = formatAddress(apiTrack.artist.artistContractAddress) === formatAddress(nft.contractAddress);
    const sameTrackAsNFT = apiTrack.title.trim() === getNFTTitle(nft);

    return sameArtistAsNFT && sameTrackAsNFT;
  }

  const fetchTracksByNFT = async (nfts: NFT[]) => {
    const apiResponse = await getAllMintedReleasesFunction();
    const apiTracks = apiResponse.map(apiTrack => ({
      ...apiTrack,
      trackId: mapAPITrackToTrackID(apiTrack),
    }))

    
    const filteredAPITracks = apiTracks.filter(apiTrack => {
      const matchedNFT = nfts.find((nft: NFT) => nftMatchesTrack(nft, apiTrack));
      return !!matchedNFT;
    });

    filteredAPITracks.forEach(apiTrack => {
      if (apiTrack.tracks.length > 1) {
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
    return nfts.reduce((accum, nft) => {
      const nftTrack = audioAPITracks.find(track => nftMatchesTrack(nft, track));
      if (!nftTrack || !nftTrack.trackId) {
        console.dir({ nftTrack, nft })

        throw new Error('No track found for NFT')
      }
      accum[nft.id] = nftTrack.trackId;
      return accum;
    }, {} as any);
  };

  const fetchTracksByTrackId = async (trackIds: string[]) => {
    const apiResponse = await getAllMintedReleasesFunction();
    const apiTracks = apiResponse.map(apiTrack => ({
      ...apiTrack,
      trackId: mapAPITrackToTrackID(apiTrack),
    }))
    const filteredAPITracks = apiTracks.filter(apiTrack => trackIds.includes(apiTrack.trackId));
    filteredAPITracks.forEach(apiTrack => {
      if (apiTrack.tracks.length > 1) {
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
    fetchTracksByTrackId,
    fetchTracksByNFT
  };
}

export default {
  init
};
