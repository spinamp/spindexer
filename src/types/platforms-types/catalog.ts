import _ from 'lodash';

import { slugify } from '../../utils/identifiers';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { NFT } from '../nft';
import { MapNFTsToTrackIds, MapTrack } from '../processor';

const mapNFTtoTrackID = (nft: NFT): string => {
  const [contractAddress, nftId] = nft.id.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
}

const mapAPITrackToArtistID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.artist.id)}`;
};

const mapTrack: MapTrack = (nft, apiTrack) => {
  if (!apiTrack) {
    throw new Error('missing api track');
  }
  return {
    id: apiTrack.trackId,
    platformInternalId: apiTrack.id,
    title: apiTrack.title,
    slug: slugify(`${apiTrack.title} ${nft.createdAtTime.getTime()}`),
    description: apiTrack.description,
    platformId: nft.platformId,
    lossyAudioIPFSHash: apiTrack.ipfs_hash_lossy_audio,
    lossyAudioURL: `https://catalogworks.b-cdn.net/ipfs/${apiTrack.ipfs_hash_lossy_audio}`,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    lossyArtworkIPFSHash: apiTrack.ipfs_hash_lossy_artwork,
    lossyArtworkURL: `https://catalogworks.b-cdn.net/ipfs/${apiTrack.ipfs_hash_lossy_artwork}`,
    websiteUrl:
    apiTrack.artist.handle && apiTrack.short_url
      ? `https://beta.catalog.works/${apiTrack.artist.handle}/${apiTrack.short_url}`
      : 'https://beta.catalog.works',
    artistId: mapAPITrackToArtistID(apiTrack),
  }
};

const mapArtistProfile = ({ apiTrack, nft }: { apiTrack: any, nft?: NFT }): ArtistProfile => {
  if (!apiTrack) {
    throw new Error('missing api track');
  }
  const artist = apiTrack.artist;
  return {
    name: artist.name,
    artistId: mapAPITrackToArtistID(apiTrack),
    platformInternalId: artist.id,
    platformId: nft!.platformId,
    avatarUrl: artist.picture_uri,
    websiteUrl: artist.handle
      ? `https://beta.catalog.works/${artist.handle}`
      : 'https://beta.catalog.works',
    createdAtTime: nft!.createdAtTime,
    createdAtEthereumBlockNumber: nft!.createdAtEthereumBlockNumber
  }
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (nfts) => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
