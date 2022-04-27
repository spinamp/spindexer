import _ from 'lodash';
import slugify from 'slugify';

import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { MusicPlatform } from '../platform';
import { ProcessedTrack } from '../track';

const mapAPITrackToArtistID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.artist.user.publicAddress)}`;
};

const mapTrack = (
  nft: ERC721NFT,
  apiTrack: any
): ProcessedTrack => {
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

const mapArtistProfile = (apiTrack: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
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
