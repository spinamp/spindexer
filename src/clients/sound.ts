import { gql, GraphQLClient } from 'graphql-request';

import { formatAddress } from '../types/address';
import { getTraitType, NFT } from '../types/nft';
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
  if (!apiTrack.contractAddress) {
    throw new Error('Missing sound.xyz api track contract address');
  }
  if (!apiTrack.editionId) {
    throw new Error('Missing sound.xyz api track editionId');
  }
  return ethereumTrackId(apiTrack.contractAddress, apiTrack.editionId);
};

export type SoundClient = {
  fetchTracksByTrackId: (trackIds: string[]) => Promise<any[]>;
  audioFromTrack: (trackId: string) => Promise<any>;
  fetchMintTimes: (addresses: string[]) => Promise<any>;
  fetchPublicTimes: (addresses: string[]) => Promise<any>;
  fetchContractAddresses: () => Promise<Set<string>>;
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

  const searchFunctionSingle = async (nft: NFT): Promise<any[]> => {
    const title = getTraitType(nft, 'Song Edition');
    const result = await soundAPI.request(
      gql`
        {
          search(input:{ text: "${title}" }) {
              releases {
                createdAt
                title
                titleSlug
                behindTheMusic
                editionId
                contractAddress
                coverImage {
                  id
                  url
                }
                artist {
                  id
                  name
                  soundHandle
                  user {
                      publicAddress
                      avatar {
                        url
                      }
                  }
                }
                track {
                  id
                  title
                  trackNumber
                  duration
                }
              }
          }
      }
      `,
    );
    return result.search.releases;
  };

  const searchFunction = async (nfts: NFT[]): Promise<any[]> => {
    let results: any = [];
    for (let i = 0; i < nfts.length; i++) {
      const result = await searchFunctionSingle(nfts[i])
      results = results.concat(result);
    }
    return results
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
    const sameArtistAsNFT = formatAddress(apiTrack.contractAddress) === formatAddress(nft.contractAddress);
    const sameTrackAsNFT = apiTrack.title.trim() === getNFTTitle(nft);
    return sameArtistAsNFT && sameTrackAsNFT;
  }

  const fetchTracksByNFT = async (nfts: NFT[]) => {
    const apiResponse = await searchFunction(nfts);
    const apiTracks = apiResponse.map(apiTrack => ({
      ...apiTrack,
      trackId: mapAPITrackToTrackID(apiTrack),
    }))

    const filteredAPITracks = apiTracks.filter(apiTrack => {
      const matchedNFT = nfts.find((nft: NFT) => nftMatchesTrack(nft, apiTrack));
      return !!matchedNFT;
    });

    const audioAPITrackPromises = filteredAPITracks.map(async apiTrack => {
      return {
        ...apiTrack,
        tracks: [{
          ...apiTrack.track,
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
    throw new Error('Functionality broken - needs to be fixes');
    const apiResponse = await Promise.resolve([{} as any]); // todo
    // const apiResponse = await searchFunction();
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

  const fetchPublicTimes = async (addresses: string[]): Promise<any> => {
    let results: any = [];
    for (let i = 0; i < addresses.length; i++) {
      const { releaseContract } = await soundAPI.request(
        gql`
            {
              releaseContract(contractAddress:"${addresses[i]}") {
                publicListeningParty
                contract {
                    contractAddress
                }
              }
            }
            `,
      );
      results = results.concat(releaseContract);
    }

    return (results as Array<any>).reduce((accum, release: any) => {
      accum[release.contract.contractAddress] = release.publicListeningParty;
      return accum;
    }, {});
  };

  const fetchMintTimes = async (addresses: string[]): Promise<any> => {
    let results: any = [];
    for (let i = 0; i < addresses.length; i++) {
      const { releaseContract } = await soundAPI.request(
        gql`
            {
              releaseContract(contractAddress:"${addresses[i]}") {
                mintStartTime
                contract {
                    contractAddress
                }
              }
            }
            `,
      );
      results = results.concat(releaseContract);
    }

    return (results as Array<any>).reduce((accum, release: any) => {
      accum[release.contract.contractAddress] = release.mintStartTime;
      return accum;
    }, {});
  };

  const fetchContractAddresses = async (
  ): Promise<Set<string>> => {
    const { allMintedReleases } = await soundAPI.request(
      gql`
        {
          allMintedReleases {
            contract {
                contractAddress
            }
          }
        }
      `,
    );
    return (allMintedReleases as Array<any>).reduce((accum: Set<string>, release: any) => {
      accum.add(formatAddress(release.contract.contractAddress));
      return accum;
    }, new Set());
  };


  return {
    audioFromTrack,
    searchFunction,
    fetchTracksByTrackId,
    fetchTracksByNFT,
    fetchMintTimes,
    fetchPublicTimes,
    fetchContractAddresses
  };
}

export default {
  init
};
