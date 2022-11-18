import _ from 'lodash';

import { extractHashFromURL } from '../../clients/ipfs';
import { evmTrackId, slugify } from '../../utils/identifiers';
import { ArtistProfile } from '../artist';
import { MapTrack, MapNFTsToTrackIds } from '../mapping';
import { NFT, NftFactory } from '../nft';
import { ProcessedTrack } from '../track';

export const mapTrack: MapTrack = (
  nft,
  apiTrack,
  contract?,
) => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }

  const lossyAudioIPFSHash = extractHashFromURL(nft.metadata.animation_url) || undefined;
  const lossyArtworkIPFSHash = extractHashFromURL(nft.metadata.image) || undefined;
  const lossyAudioURL = nft.metadata.animation_url;
  const lossyArtworkURL = nft.metadata.image;


  if (!lossyAudioIPFSHash && !lossyAudioURL) {
    throw new Error('Failed to extract audio from nft');
  }

  if (!lossyArtworkIPFSHash && !lossyArtworkURL) {
    throw new Error('Failed to extract audio from nft');
  }

  const track: Partial<ProcessedTrack> = {
    id: mapNFTtoTrackID(nft),
    platformInternalId: contract.id,
    title: contract.name || nft.metadata.name,
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash,
    lossyArtworkIPFSHash,
    lossyAudioURL,
    lossyArtworkURL,
    websiteUrl: nft.metadata.external_url,
    artistId: mapArtistProfile({ apiTrack, contract, nft }).artistId,
    createdAtTime: nft.createdAtTime,
    createdAtBlockNumber: nft.createdAtBlockNumber,
    ...contract.typeMetadata?.overrides?.track
  };

  track.slug = slugify(`${track.title} ${nft.createdAtTime.getTime()}`);

  return track as ProcessedTrack;
};

export const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }): ArtistProfile => {
  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }
  if (!contract) {
    throw new Error(`Contract missing for mapArtistProfile for nft ${nft.id}`)
  }
  return {
    name: contract.platformId, //set in db when contract is created in db
    artistId: contract.platformId,
    platformInternalId: contract.platformId,
    platformId: contract.platformId,
    avatarUrl: undefined,
    websiteUrl: nft.metadata.external_url,
    createdAtTime: nft.createdAtTime,
    createdAtBlockNumber: nft.createdAtBlockNumber,
    ...contract.typeMetadata?.overrides?.artist
  }
};

const mapNFTtoTrackID = (nft: NFT): string => {
  return evmTrackId(nft.chainId, nft.contractAddress, '');
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (input) => {
  return _.groupBy(input.nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
