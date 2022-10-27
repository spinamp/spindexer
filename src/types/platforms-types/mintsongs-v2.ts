import _ from 'lodash';

import { extractHashFromURL } from '../../clients/ipfs';
import { ethereumTrackId, etheruemId, slugify } from '../../utils/identifiers';
import { ArtistProfile } from '../artist';
import { MapTrack, MapNFTsToTrackIds } from '../mapping';
import { NFT, NftFactory } from '../nft';

const extractArtistIdFromNFT = (nft: NFT) => {
  const artistURL = nft.metadata.external_url;
  const prefix = artistURL.slice(0,28);
  if (prefix !== 'https://www.mintsongs.com/u/') {
    throw new Error('Unexpected mintsongs artist url prefix');
  }
  const artistAddress = artistURL.slice(28,70);
  if (artistAddress.length !== 42) {
    throw new Error('Unexpected artist address length');
  }
  return etheruemId(artistAddress);
}

const mapTrack: MapTrack = (
  nft,
  apiTrack,
  contract?,
  trackId?
) => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }
  if (!trackId) {
    throw new Error(`Track id not provided for nft ${nft.id}`)
  }
  return ({
    id: trackId,
    platformInternalId: nft.metadata.name,
    title: nft.metadata.title,
    slug: slugify(`${nft.metadata.title} ${nft.createdAtTime.getTime()}`),
    description: nft.metadata.description,
    platformId: 'mintsongs',
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url)!,
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image)!,
    websiteUrl: nft.metadata.external_url,
    artistId: extractArtistIdFromNFT(nft),
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  })
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }): ArtistProfile => {
  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }
  if (!contract) {
    throw new Error(`Contract missing for mapArtistProfile for nft ${nft.id}`)
  }
  return {
    name: nft?.metadata.artist,
    artistId: extractArtistIdFromNFT(nft),
    platformInternalId: extractArtistIdFromNFT(nft),
    platformId: 'mintsongs',
    avatarUrl: `${process.env.IPFS_ENDPOINT}${extractHashFromURL(nft.metadata.image)}`,
    websiteUrl: nft.metadata.external_url,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber
  }
};

const mapNFTtoLatestTrackID = (nft: NFT, dupNFTs: NFT[]): string => {
  const primaryNFT = selectPrimaryNFTForTrackMapper(dupNFTs);
  return ethereumTrackId(primaryNFT.contractAddress, primaryNFT.tokenId.toString());
};

const selectPrimaryNFTForTrackMapper = (nfts: NFT[]) => {
  const sortedNFTs = _.sortBy(nfts, 'tokenId');
  const lastNFT = sortedNFTs[sortedNFTs.length - 1];
  return lastNFT;
}

const mapNFTsToTrackIds: MapNFTsToTrackIds = (input) => {
  const nftsByMetadataName = _.groupBy(input.nfts, (nft) => {
    return nft.metadata.name;
  });

  const nftsByTrackId = _.groupBy(input.nfts, (nft) => {
    return mapNFTtoLatestTrackID(nft, nftsByMetadataName[nft.metadata.name])
  });

  return nftsByTrackId;
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile,
  selectPrimaryNFTForTrackMapper,
}
