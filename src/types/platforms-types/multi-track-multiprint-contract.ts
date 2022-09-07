import _ from 'lodash';

import { extractHashFromURL } from '../../clients/ipfs';
import { slugify } from '../../utils/identifiers';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { idExtractor, Extractor, titleExtractor } from '../fieldExtractor';
import { NFT, NftFactory } from '../nft';
import { MapNFTsToTrackIds, MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

const mapTrack: MapTrack = (
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
    id: mapNFTtoTrackID(nft, idExtractor(contract)),
    platformInternalId: mapNFTtoTrackID(nft, idExtractor(contract)),
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

const mapNFTtoTrackID = (nft: NFT, extractor?: Extractor): string => {
  if (!extractor) {
    throw new Error('No extractor provided');
  }
  const id = extractor(nft);
  if (!id) {
    throw new Error('ID not extracted correctly');
  }
  return `ethereum/${formatAddress(nft.contractAddress)}/${id}`;
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (nfts, dbClient?, apiTracksByNFT?, extractor?) => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft, extractor));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
