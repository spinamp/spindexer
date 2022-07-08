import _ from 'lodash';
import slugify from 'slugify';

import { extractHashFromURL } from '../../clients/ipfs';
import { DBClient } from '../../db/db';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { ERC721Contract } from '../ethereum';
import { ProcessedTrack } from '../track';

const extractArtistIdFromNFT = (nft: ERC721NFT) => {
  const artistURL = nft.metadata.external_url;
  const prefix = artistURL.slice(0,28);
  if (prefix !== 'https://www.mintsongs.com/u/') {
    throw new Error('Unexpected mintsongs artist url prefix');
  }
  const artistAddress = artistURL.slice(28,70);
  if (artistAddress.length !== 42) {
    throw new Error('Unexpected artist address length');
  }
  return `ethereum/${artistAddress}`;
}

const mapTrack = (
  nft: ERC721NFT,
  apiTrack: any,
  contract?: ERC721Contract,
  trackId?: string
): ProcessedTrack => {
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
    slug: slugify(`${nft.metadata.title} ${nft.createdAtTime.getTime()}`).toLowerCase(),
    description: nft.metadata.description,
    platformId: 'mintsongs',
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
    websiteUrl: nft.metadata.external_url,
    artistId: extractArtistIdFromNFT(nft),
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  })
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract }): ArtistProfile => {
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

const mapNFTtoLatestTrackID = (nft: ERC721NFT, dupNFTs: ERC721NFT[]): string => {
  const primaryNFT = selectPrimaryNFTForTrackMapper(dupNFTs);
  return `ethereum/${formatAddress(primaryNFT.contractAddress)}/${primaryNFT.tokenId}`;
};

const selectPrimaryNFTForTrackMapper = (nfts: ERC721NFT[]) => {
  const sortedNFTs = _.sortBy(nfts, 'tokenId');
  const lastNFT = sortedNFTs[sortedNFTs.length - 1];
  return lastNFT;
}

const mapNFTsToTrackIds = async (nfts: ERC721NFT[], dbClient?: DBClient): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  if (!dbClient) {
    throw new Error('DB Client not provided to mintsongs mapper')
  }

  const nftsByMetadataName = _.groupBy(nfts, (nft) => {
    return nft.metadata.name;
  });

  const nftsByTrackId = _.groupBy(nfts, (nft) => {
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
