import _ from 'lodash';

import { extractHashFromURL } from '../../clients/ipfs';
import { slugify } from '../../utils/identifiers';
import { ArtistProfile } from '../artist';
import { resolveEthereumTrackIdOverrides, titleExtractor } from '../fieldExtractor';
import { NFT, NftFactory } from '../nft';
import { MapNFTsToTrackIds, MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

const mapTrack: MapTrack = (
  nft,
  apiTrack,
  contract,
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
    id: mapNFTtoTrackID(nft, contract),
    platformInternalId: mapNFTtoTrackID(nft, contract),
    title: titleExtractor(contract)(nft),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash,
    lossyArtworkIPFSHash,
    lossyAudioURL,
    lossyArtworkURL,
    websiteUrl: nft.metadata.external_url,
    artistId: mapArtistProfile({ apiTrack: apiTrack, nft: nft, contract: contract }).artistId,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    ...contract.typeMetadata?.overrides?.track
  };

  track.slug = slugify(`${track.title} ${nft.createdAtTime.getTime()}`);

  return track as ProcessedTrack;
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }): ArtistProfile => {
  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }
  if (!contract) {
    throw new Error(`Contract missing for mapArtistProfile for nft ${nft.id}`)
  }
  return {
    name: contract.platformId,
    artistId: contract.platformId,
    platformInternalId: contract.platformId,
    platformId: contract.platformId,
    avatarUrl: undefined,
    websiteUrl: nft.metadata.external_url,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    ...contract.typeMetadata?.overrides?.artist
  }
};

const mapNFTtoTrackID = (nft: NFT, contract: NftFactory): string => {
  return resolveEthereumTrackIdOverrides(nft, contract);
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (nfts, dbClient?, apiTracksByNFT?, contract?) => {
  if (!contract) {
    throw new Error('No contract provided');
  }
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft, contract));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
