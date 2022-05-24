import _ from 'lodash';

import { mapAPITrack, mapAPITrackTime, mapAPITrackToArtistID } from '../../clients/noizd';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { ProcessedTrack } from '../track';


export const mapArtistProfile = ({ apiTrack, nft }: { apiTrack: any, nft?: ERC721NFT }): ArtistProfile => {
  let createdAtTime, createdAtEthereumBlockNumber
  if (nft) {
    createdAtTime = nft.createdAtTime
    createdAtEthereumBlockNumber = nft.createdAtEthereumBlockNumber
  } else {
    createdAtTime = mapAPITrackTime(apiTrack)
  }
  const artist = apiTrack.artist;
  return {
    name: artist.username,
    artistId: mapAPITrackToArtistID(apiTrack),
    platformInternalId: artist.id,
    platformId: 'noizd',
    avatarUrl: artist.profile?.image_profile?.url,
    websiteUrl: `https://noizd.com/u/${artist.uri}`,
    createdAtTime,
    createdAtEthereumBlockNumber
  };
};

const mapTrack = (nft: ERC721NFT, apiTrack: any): ProcessedTrack => {
  const processedTrack = mapAPITrack(apiTrack);
  if (!nft.metadata) {
    return processedTrack;
  }
  return {
    ...processedTrack,
    id: mapNFTtoTrackID(nft),
    lossyAudioURL: apiTrack.metadata.audio_url,
    createdAtTime: processedTrack.createdAtTime || nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  };
};

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const [contractAddress, nftId] = nft.id.split('/');
  const externalURL = nft.metadata.external_url;
  const trackId = externalURL.split('/assets/')[1];
  return `ethereum/${formatAddress(contractAddress)}/${trackId}`;
}

const mapNFTsToTrackIds = (nfts: ERC721NFT[]): { [trackId: string]: ERC721NFT[] } => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile,
}
