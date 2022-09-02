import _ from 'lodash';
import slugify from 'slugify';


import { extractHashFromURL } from '../../clients/ipfs';
import { DBClient } from '../../db/db';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { titleExtractor, titleExtractorFunction } from '../fieldExtractor';
import { NFT, NftFactory } from '../nft';
import { MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

const mapTrack: MapTrack = (
  nft: NFT,
  apiTrack: any,
  contract?: NftFactory,
  trackId?: string,
): ProcessedTrack => {
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

  const extractor = titleExtractorFunction(contract);

  const track: Partial<ProcessedTrack> = {
    id: mapNFTtoTrackID(nft, extractor),
    platformInternalId: mapNFTtoTrackID(nft, extractor),
    title: titleExtractor(nft, contract),
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

  track.slug = slugify(`${track.title} ${nft.createdAtTime.getTime()}`, { lower: true, strict: true });

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

const mapNFTtoTrackID = (nft: NFT, extractor: any): string => {
  const trackName = slugify(extractor(nft), { lower: true, strict: true });
  return `ethereum/${formatAddress(nft.contractAddress)}/${trackName}`;
};

const mapNFTsToTrackIds = async (nfts: NFT[], dbClient?: DBClient | undefined, extractor?: any): Promise<{ [trackId: string]: NFT[] }> => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft, extractor));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
