import _ from 'lodash';
import slugify from 'slugify';

import { extractHashFromURL } from '../../clients/ipfs';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { ERC721Contract } from '../ethereum';
import { ProcessedTrack } from '../track';

const mapTrack = (
  nft: ERC721NFT,
  apiTrack: any,
  contract?: ERC721Contract,
): ProcessedTrack => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }
  const song = getSong(nft);
  return ({
    id: mapNFTtoTrackID(nft),
    platformInternalId: song,
    title: song,
    slug: slugify(`${song} ${nft.createdAtTime.getTime()}`).toLowerCase(),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
    websiteUrl: 'https://www.chaos.build/',
    artistId: contract.platformId,
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
    name: contract.name!, //set in db when contract is created in db
    artistId: contract.platformId,
    platformInternalId: contract.platformId,
    platformId: contract.platformId,
    avatarUrl: 'https://pbs.twimg.com/profile_images/1511382001730920450/r-WPJO2T_400x400.jpg',
    websiteUrl: 'https://www.chaos.build/',
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber
  }
};

const getTrait = (nft: ERC721NFT, type:String) => {
  if(!nft.metadata) {
    console.error({nft})
    throw new Error('Missing nft metadata');
  }
  if(!nft.metadata.attributes) {
    console.error({nft})
    throw new Error('Missing attributes');
  }
  const attribute = nft.metadata.attributes.find((attribute:any) => {
    if(!attribute || !attribute.trait_type) {
      console.error({nft, type})
      throw new Error('Unknown attribute/trait');
    }
    return attribute.trait_type.toLowerCase() === type.toLowerCase()
  });
  if (!attribute) {
    throw new Error('Trait not found');
  }
  return attribute.value;
};

const getSong = (nft: ERC721NFT) => getTrait(nft, 'Song');

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const song = getSong(nft);
  return `ethereum/${formatAddress(nft.contractAddress)}/${song}`;
};

const mapNFTsToTrackIds = (nfts: ERC721NFT[]): { [trackId: string]: ERC721NFT[] } => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
