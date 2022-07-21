
import _ from 'lodash';
import slugify from 'slugify';


import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { ERC721Contract } from '../ethereum';
import { MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

const mapTrack: MapTrack = (
  nft: ERC721NFT,
  apiTrack: any,
  contract?: ERC721Contract,
  trackId?: string,
): ProcessedTrack => {

  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }

  const track: Partial<ProcessedTrack> = {
    id: mapNFTtoTrackID(nft),
    platformInternalId: nft.id,
    title: nft.metadata.name.slice(0, 1000), // TODO: should split string and remove artist from title?
    description: nft.metadata.description,
    platformId: nft.platformId,
    lossyAudioURL: nft.metadata.animation_url,
    lossyArtworkURL: nft.metadata.image,
    websiteUrl: nft.metadata.external_url,
    artistId: mapArtistProfile({ nft, contract, apiTrack }).artistId,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  };

  track.slug = slugify(`${track.title} ${track.createdAtTime!.getTime()}`).toLowerCase();

  return track as ProcessedTrack;
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract }): ArtistProfile => {

  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }

  return {
    name: nft.metadata.properties.artist,
    artistId: `nina/${nft.metadata.properties.artist.replace(' ', '-')}`,
    platformInternalId: nft.platformId,
    platformId: nft.platformId,
    avatarUrl: undefined,
    websiteUrl: nft.metadata.external_url,
    createdAtTime: nft.createdAtTime, 
  }
};

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  return `${nft.id}`
};

const mapNFTsToTrackIds = async (nfts: ERC721NFT[]): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
