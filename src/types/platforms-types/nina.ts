
import _ from 'lodash';
import slugify from 'slugify';

import { ArtistProfile } from '../artist';
import { NFT, NftFactory } from '../nft';
import { MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

const mapTrack: MapTrack = (
  nft: NFT,
  apiTrack: any,
  contract?: NftFactory,
  trackId?: string,
): ProcessedTrack => {

  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }

  const track: Partial<ProcessedTrack> = {
    id: mapNFTtoTrackID(nft),
    platformInternalId: nft.id,
    title: nft.metadata.properties.title.slice(0,1000),
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

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }): ArtistProfile => {

  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }

  if (!contract?.typeMetadata?.overrides.artist?.artistId){
    throw new Error('Missing artistId override')
  }
  const artistId = contract.typeMetadata.overrides.artist.artistId;

  return {
    name: nft.metadata.properties.artist,
    artistId,
    platformInternalId: artistId,
    platformId: nft.platformId,
    avatarUrl: undefined,
    websiteUrl: `${nft.metadata.external_url}/related`,
    createdAtTime: nft.createdAtTime, 
  }
};

const mapNFTtoTrackID = (nft: NFT): string => {
  return `solana/${nft.id}`
};

const mapNFTsToTrackIds = async (nfts: NFT[]): Promise<{ [trackId: string]: NFT[] }> => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}