import _ from 'lodash';
import slugify from 'slugify';

import { extractHashFromURL } from '../../clients/ipfs';
import { formatAddress } from '../address';
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
  overrides?: Partial<ProcessedTrack>
): ProcessedTrack => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }
  return ({
    id: mapNFTtoTrackID(nft),
    platformInternalId: contract.address,
    title: contract.name || nft.metadata.name,
    slug: slugify(`${contract.name} ${nft.createdAtTime.getTime()}`).toLowerCase(),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
    websiteUrl: nft.metadata.external_url,
    artistId: contract.platformId,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    ...overrides
  })
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract }): ArtistProfile => {
};

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  return `ethereum/${formatAddress(nft.contractAddress)}`;
};

const mapNFTsToTrackIds = async (nfts: ERC721NFT[]): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
