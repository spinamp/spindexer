import _ from 'lodash';

import { extractHashFromURL } from '../../clients/ipfs';
import { slugify } from '../../utils/identifiers';
import { cleanURL } from '../../utils/sanitizers';
import { ArtistProfile } from '../artist';
import { resolveEthereumTrackIdOverrides, titleExtractor, websiteUrlExtractor } from '../fieldExtractor';
import { MapNFTsToTrackIds, MapTrack } from '../mapping';
import { NFT, NftFactory } from '../nft';
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
  const lossyAudioURL = cleanURL(nft.metadata.animation_url);
  const lossyArtworkURL = cleanURL(nft.metadata.image);

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
    websiteUrl: websiteUrlExtractor(contract)(nft),
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

const mapNFTtoTrackID = (nft: NFT, contract?: NftFactory): string => {
  if (!contract) {
    throw new Error('No contract provided');
  }
  return resolveEthereumTrackIdOverrides(nft, contract);
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (input) => {
  if (!input.contract) {
    throw new Error('No contract provided');
  }
  return _.groupBy(input.nfts, nft => mapNFTtoTrackID(nft, input.contract));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
