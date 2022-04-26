import _ from 'lodash';
import slugify from 'slugify';

import { SoundClient } from '../../clients/sound';
import { formatAddress } from '../address';
import { Artist, ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { MusicPlatform } from '../platform';
import { Clients } from '../processor';
import { NFTProcessError, NFTTrackJoin, ProcessedTrack } from '../track';

const mapAPITrackToArtistID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.artist.user.publicAddress)}`;
};

const mapAPITrackToTrackID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack?.artist?.contract?.address)}/${apiTrack?.mintInfo?.editionId}`
};

const mapTrack = (
  nft: ERC721NFT,
  apiTrack: any
): ProcessedTrack => {
  console.dir(nft,{ depth: null });
  if (!nft.metadata.audio_url) {
    throw new Error('missing nft metadata audio_url');
  }
  return ({
  id: apiTrack.trackId,
  platformInternalId: apiTrack.id,
  title: apiTrack.title,
  slug: slugify(`${apiTrack.title} ${nft.createdAtTime.getTime()}`).toLowerCase(),
  description: apiTrack.description,
  platformId: MusicPlatform.sound,
  lossyAudioURL: apiTrack.tracks[0].audio.url || nft.metadata.audio_url,
  createdAtTime: nft.createdAtTime,
  createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  lossyArtworkURL: apiTrack.coverImage.url,
  websiteUrl:
  apiTrack.artist.soundHandle && apiTrack.titleSlug
      ? `https://www.sound.xyz/${apiTrack.artist.soundHandle}/${apiTrack.titleSlug}`
      : 'https://www.sound.xyz',
  artistId: mapAPITrackToArtistID(apiTrack),
})};

export const mapArtistProfile = (apiTrack: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = apiTrack.artist
  return {
    name: artist.name,
    artistId: mapAPITrackToArtistID(apiTrack),
    platformInternalId: artist.id,
    platformId: MusicPlatform.sound,
    avatarUrl: artist.user.avatar.url,
    websiteUrl: artist.soundHandle ?
      `https://www.sound.xyz/${artist.soundHandle}`
      : 'https://www.sound.xyz',
    createdAtTime,
    createdAtEthereumBlockNumber
  }
};

const getAPITrackData = async (trackIds: string[], client: SoundClient) => {
  const apiResponse = await client.getAllMintedReleases();
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
  const audioAPITrackPromises= filteredAPITracks.map(async apiTrack => {
    return {
      ...apiTrack,
      tracks: [{
        ...apiTrack.tracks[0],
        audio: await client.audioFromTrack(apiTrack.tracks[0].id),
      }]
    };
  });
  const audioAPITracks = await Promise.all(audioAPITrackPromises);
  const apiTrackByTrackId = _.keyBy(audioAPITracks, 'trackId');
  return apiTrackByTrackId;
}

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const splitURI = nft.tokenURI!.split('/');
  const editionId = splitURI[splitURI.length - 2];
  return `ethereum/${formatAddress(nft.contractAddress)}/${editionId}`;
};

const mapNFTsToTrackIds = (nfts:ERC721NFT[]):{ [trackId: string]:ERC721NFT[] } => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}


const createTracks =  async (newTrackIds:string[], trackMapping: { [trackId: string]:ERC721NFT[] }, clients: Clients):
Promise<{
  newTracks: ProcessedTrack[],
  joins: NFTTrackJoin[],
  errorNFTs: NFTProcessError[]
  artistProfiles: ArtistProfile[]
}> => {
  const apiTrackData = await getAPITrackData(newTrackIds, clients.sound);

  const newTracks:ProcessedTrack[] = [];
  const joins:NFTTrackJoin[] = [];
  const errorNFTs:NFTProcessError[] = [];
  const artistProfiles:ArtistProfile[] = [];

  newTrackIds.forEach(trackId => {
    const trackNFTs = trackMapping[trackId];
    const apiTrack = apiTrackData[trackId];
    if(!apiTrack) {
      trackNFTs.forEach(nft => {
        errorNFTs.push({
          erc721nftId: nft.id,
          processError: `Missing api track`
        });
      })
      return undefined;
    }

    newTracks.push(mapTrack(trackNFTs[0], apiTrack));
    trackNFTs.forEach(nft => {
      joins.push({
        erc721nftId: nft.id,
        processedTrackId: trackId
      });
    })

    const artistProfile = {
      ...mapArtistProfile(apiTrack, trackNFTs[0].createdAtTime, trackNFTs[0].createdAtEthereumBlockNumber),
    } as ArtistProfile;
    artistProfiles.push(artistProfile);
  });

  const uniqueArtistProfiles = _.uniqBy(artistProfiles, 'artistId');

  return { newTracks, joins, errorNFTs, artistProfiles: uniqueArtistProfiles };
}

export default {
  mapNFTsToTrackIds,
  createTracks,
}
