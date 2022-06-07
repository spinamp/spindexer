import { id } from 'ethers/lib/utils';
import _ from 'lodash';
import slugify from 'slugify';

import { extractHashFromURL } from '../../clients/ipfs';
import { DBClient } from '../../db/db';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { ERC721Contract } from '../ethereum';
import { ProcessedTrack } from '../track';

const mapTrackIDToInternalId = (trackId: string): string => {
  return trackId.split('/')[2];
};

const extractArtistIdFromNFT = (nft: ERC721NFT) => {
  const artistURL = nft.metadata.external_url;
  const prefix = artistURL.slice(0,28);
  if (prefix !== 'https://www.mintsongs.com/u/') {
    throw new Error("Unexpected mintsongs artist url prefix");
  }
  const artistAddress = artistURL.slice(28,70);
  if (artistAddress.length !== 42) {
    throw new Error("Unexpected artist address length");
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
    platformInternalId: mapTrackIDToInternalId(trackId),
    title: nft.metadata.title,
    slug: slugify(`${nft.metadata.title} ${nft.createdAtTime.getTime()}`).toLowerCase(),
    description: nft.metadata.description,
    platformId: 'mintsongs',
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
    websiteUrl:  nft.metadata.external_url,
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
    websiteUrl:  nft.metadata.external_url,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber
  }
};

const mapFirstNFTtoTrackID = (nft: ERC721NFT, dedupedNFT: ERC721NFT): string => {
  return `ethereum/${formatAddress(nft.contractAddress)}/${dedupedNFT.tokenId}`;
};

const METADATA_DEDUP_FIELD = 'name';

const mapNFTsToTrackIds = async (nfts: ERC721NFT[], dbClient?: DBClient): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  if (!dbClient) {
    throw new Error('DB Client not provided to mintsongs mapper')
  }
  const nftsByDedupField =  _.groupBy(nfts, nft => nft.metadata[METADATA_DEDUP_FIELD]);

  const dedupFieldKeys = Object.keys(nftsByDedupField);

  const dedupFieldKeysQuery = dedupFieldKeys.map((key:any) => '?').join(',')

  // The below query does the following:
  // - Gets the lowest tokenId that matches each nft to be mapped based on the dedup field (eg: matching name)
  const existingDedupKeysQuery = `
  select
  metadata ->> '${METADATA_DEDUP_FIELD}' as dedup_field,
  MIN(CAST("tokenId" AS bigint)) as "tokenId"
  from "erc721nfts"
  where "platformId"='mintsongs'  and
  metadata ->> '${METADATA_DEDUP_FIELD}' in (${dedupFieldKeysQuery})
  GROUP BY dedup_field
  `

  const firstMatchingNFTs = (await dbClient.rawBoundSQL(
    existingDedupKeysQuery,
    [dedupFieldKeys]
  )).rows;

  const firstNFTsByDedup = _.keyBy(firstMatchingNFTs, 'dedup_field');

  const nftsByTrackId = _.groupBy(nfts, (nft) => {
    const dedupValue = nft.metadata[METADATA_DEDUP_FIELD];
    const dedupedNFT = firstNFTsByDedup[dedupValue];
    if (!dedupedNFT) {
      throw new Error('Error, could not dedup nfts properly');
    }
    return mapFirstNFTtoTrackID(nft, dedupedNFT)
  });

  return nftsByTrackId;
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
