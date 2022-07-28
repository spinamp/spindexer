import _ from 'lodash';
import slugify from 'slugify';


import { extractHashFromURL } from '../../clients/ipfs';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT, getTrait } from '../erc721nft';
import { ERC721Contract } from '../ethereum';
import { MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

const mapTrack: MapTrack = (
  nft: ERC721NFT,
  apiTrack: any,
  contract?: ERC721Contract,
  trackId?: string,
): ProcessedTrack => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }

  const track: Partial<ProcessedTrack> = {
    id: mapNFTtoTrackID(nft),
    platformInternalId: mapNFTtoTrackID(nft),
    title: getTrait(nft, 'Track'),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
    websiteUrl: nft.metadata.external_url,
    artistId: mapArtistProfile({ apiTrack: apiTrack, nft: nft, contract: contract }).artistId,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    ...contract.typeMetadata?.overrides?.track
  };

  track.slug = slugify(`${track.title} ${nft.createdAtTime.getTime()}`).toLowerCase();

  return track as ProcessedTrack;
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract }): ArtistProfile => {
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

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const trackName = getTrait(nft, 'Track');
  return `ethereum/${formatAddress(nft.contractAddress)}/${trackName}`;
};

const mapNFTsToTrackIds = async (nfts: ERC721NFT[]): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
