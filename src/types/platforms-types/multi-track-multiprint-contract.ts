import _ from 'lodash';

import { extractHashFromURL } from '../../clients/ipfs';
import { slugify } from '../../utils/identifiers';
import { ArtistProfile } from '../artist';
import { FailedAudioExtractionError } from '../error';
import { resolveArtistId, resolveArtistName, resolveArtistWebsiteUrl, resolveArtworkUrl, resolveAudioUrl, resolveAvatarUrl, resolveEthereumTrackId, resolveTitle, resolveWebsiteUrl } from '../fieldExtractor';
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

  const lossyAudioURL = resolveAudioUrl(nft, contract);
  const lossyArtworkURL = resolveArtworkUrl(nft, contract);
  const lossyAudioIPFSHash = extractHashFromURL(lossyAudioURL) || undefined;
  const lossyArtworkIPFSHash = extractHashFromURL(lossyArtworkURL) || undefined;

  const id = mapNFTtoTrackID(nft, contract);
  if (!id) {
    throw new Error(`Attempted to map track with null id for nft ${nft.id}`)
  }

  if (!lossyAudioIPFSHash && !lossyAudioURL) {
    throw FailedAudioExtractionError;
  }

  if (!lossyArtworkIPFSHash && !lossyArtworkURL) {
    throw new Error('Failed to extract artwork from nft');
  }

  const track: Partial<ProcessedTrack> = {
    id,
    platformInternalId: id,
    title: resolveTitle(nft, contract),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash,
    lossyArtworkIPFSHash,
    lossyAudioURL,
    lossyArtworkURL,
    websiteUrl: resolveWebsiteUrl(nft, contract),
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
    name: resolveArtistName(nft, contract),
    artistId: resolveArtistId(nft, contract),
    platformInternalId: contract.platformId,
    platformId: contract.platformId,
    avatarUrl: resolveAvatarUrl(nft,contract),
    websiteUrl: resolveArtistWebsiteUrl(nft, contract),
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    ...contract.typeMetadata?.overrides?.artist
  }
};

const mapNFTtoTrackID = (nft: NFT, contract?: NftFactory): string | null => {
  if (!contract) {
    throw new Error('No contract provided');
  }
  return resolveEthereumTrackId(nft, contract);
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (input) => {
  if (!input.contract) {
    throw new Error('No contract provided');
  }
  return _.groupBy(input.nfts, nft => {
    try {
      return mapNFTtoTrackID(nft, input.contract);
    } catch (e) {
      return 'null';
    }
  });
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
