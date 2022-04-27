import _ from 'lodash';
import slugify from 'slugify';

import { NOIZDAPITrack } from '../../clients/noizd';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { isGif, isMP4 } from '../media';
import { MusicPlatform } from '../platform';
import { ProcessedTrack } from '../track';

const getNoizdVideoPosterUrl = (url: string) => {
  return url.substr(0, url.lastIndexOf('.')) + '.jpg';
};

const getNoizdResizedUrl = (src: string, size?: number | string): string => {
  if (!size || !src.startsWith('https://cf')) {
    return src;
  }

  const urlParts = src.split('/');
  const imageName = urlParts.pop();
  return [...urlParts, size, imageName].join('/');
};

const mapAPITrackToArtistID = (apiTrack: any) => `noizd/${apiTrack.artist.id}`;

export const mapArtistProfile = (apiTrack: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = apiTrack.artist;
  return {
    name: artist.username,
    artistId: mapAPITrackToArtistID(apiTrack),
    platformInternalId: artist.id,
    platformId: MusicPlatform.noizd,
    avatarUrl: artist.profile?.image_profile?.url,
    websiteUrl: `https://noizd.com/u/${artist.uri}`,
    createdAtTime,
    createdAtEthereumBlockNumber
  };
};

const mapAPITrackTime = (apiTrack: any) => new Date(apiTrack.created)

const mapAPITrack: (apiTrack: NOIZDAPITrack) => ProcessedTrack = (apiTrack: any) => {
  const { cover } = apiTrack;
  const artwork = isMP4(cover.mime)
    ? getNoizdVideoPosterUrl(cover.url)
    : isGif(cover.mime)
      ? getNoizdResizedUrl(cover.url, 450)
      : cover.url;

  return {
    id: apiTrack.id,
    platformInternalId: apiTrack.id,
    title: apiTrack.title,
    slug: slugify(`${apiTrack.title} ${mapAPITrackTime(apiTrack).getTime()}`).toLowerCase(),
    description: apiTrack.description,
    platformId: MusicPlatform.noizd,
    lossyAudioURL: apiTrack.metadata ? apiTrack.metadata.audio_url : apiTrack.full.url,
    createdAtTime: mapAPITrackTime(apiTrack),
    lossyArtworkURL: artwork,
    websiteUrl: `https://noizd.com/assets/${apiTrack.id}`,
    artistId: mapAPITrackToArtistID(apiTrack),
  }
}

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
  return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
}

const mapNFTsToTrackIds = (nfts:ERC721NFT[]):{ [trackId: string]:ERC721NFT[] } => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
