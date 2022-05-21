import _ from 'lodash';
import slugify from 'slugify';

import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { MusicPlatform } from '../platform';
import { ProcessedTrack } from '../track';

const mapAPITrackToArtistID = (apiTrack: { nft: ERC721NFT }): string => {
  return `ethereum/${formatAddress(apiTrack.nft.contractAddress)}`;
};

const mapTrack = (
  nft: ERC721NFT,
  apiTrack: any
): ProcessedTrack => {
  if (!apiTrack.tracks[0].audio) {
    throw new Error('missing nft metadata audio_url');
  }
  const namePieces = nft.metadata.name.split(' — ');
  namePieces.pop();
  const name = namePieces.join(' — ');
  return ({
  id: apiTrack.trackId,
  platformInternalId: apiTrack.id,
  title: name,
  slug: slugify(`${name} ${nft.createdAtTime.getTime()}`).toLowerCase(),
  description: nft.metadata.description,
  platformId: apiTrack.nft.platformId,
  lossyAudioURL: nft.metadata.audio_url,
  createdAtTime: nft.createdAtTime,
  createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  lossyArtworkURL: nft.metadata.image,
  websiteUrl: nft.metadata.external_url,
  artistId: nft.contractAddress,
})};

const mapArtistProfile = (apiTrack: { nft: ERC721NFT }, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = apiTrack.nft.platformId
  return {
    name: apiTrack.nft.platformId,
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

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const splitURI = nft.tokenURI!.split('/');
  const editionId = splitURI[splitURI.length - 2];
  return `ethereum/${formatAddress(nft.contractAddress)}/${editionId}`;
};

const mapNFTsToTrackIds = (nfts:ERC721NFT[]):{ [trackId: string]:ERC721NFT[] } => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
