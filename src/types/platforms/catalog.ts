import _ from 'lodash';
import slugify from 'slugify';

import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { ProcessedTrack } from '../track';

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const [contractAddress, nftId] = nft.id.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
}

const mapAPITrackToArtistID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.artist.id)}`;
};

const mapTrack = (nft: ERC721NFT, apiTrack: any): ProcessedTrack => ({
  id: apiTrack.trackId,
  platformInternalId: apiTrack.id,
  title: apiTrack.title,
  slug: slugify(`${apiTrack.title} ${nft.createdAtTime.getTime()}`).toLowerCase(),
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
});

const mapArtistProfile = ({ apiTrack, nft }: { apiTrack: any, nft?: ERC721NFT }): ArtistProfile => {
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

const mapNFTsToTrackIds = (nfts: ERC721NFT[]): { [trackId: string]: ERC721NFT[] } => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
