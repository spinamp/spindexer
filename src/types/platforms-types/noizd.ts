import _ from 'lodash';

import { mapAPITrack, mapAPITrackTime, mapAPITrackToArtistID } from '../../clients/noizd';
import { ethereumTrackId } from '../../utils/identifiers';
import { ArtistProfile } from '../artist';
import { NFT } from '../nft';
import { MapNFTsToTrackIds, MapTrack } from '../processor';


export const mapArtistProfile = ({ apiTrack, nft }: { apiTrack: any, nft?: NFT }): ArtistProfile => {
  if (!apiTrack) {
    throw new Error('missing api track');
  }
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

const mapTrack: MapTrack = (nft, apiTrack) => {
  if (!apiTrack) {
    throw new Error('missing api track');
  }
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

const mapNFTtoTrackID = (nft: NFT): string => {
  const [contractAddress, nftId] = nft.id.split('/');
  const externalURL = nft.metadata.external_url;
  const trackId = externalURL.split('/assets/')[1];
  return ethereumTrackId(contractAddress, trackId);
}

const mapNFTsToTrackIds: MapNFTsToTrackIds = (nfts) => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile,
}
