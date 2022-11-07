import { ValidContractNFTCallFunction } from '../clients/evm';

import { ArtistProfile } from './artist';
import { ChainId } from './chain';
import { Contract } from './contract';
import { ExtractorTypes } from './fieldExtractor';
import { NFTFactoryTypes } from './nftFactory';
import { MusicPlatformType } from './platform';
import { Record } from './record';
import { ProcessedTrack } from './track';

export enum Chain {
  ETHEREUM = 'ethereum',
  SOLANA = 'solana'
}

export type NFT = Record & {
  contractAddress: string
  tokenId: bigint
  platformId: string
  metadataIPFSHash?: string
  [ValidContractNFTCallFunction.tokenURI]?: string
  [ValidContractNFTCallFunction.tokenMetadataURI]?: string
  metadata?: any
  mimeType?: string
  owner: string
  standard: NFTStandard;
  approved: boolean;
  burned: boolean;
  publicReleaseTime?: Date;
  chainId: ChainId;
}

export type ERC721Transfer = Record & {
  from: string
  to: string
  contractAddress: string
  tokenId: bigint
  nftId: string;
  transactionHash: string;
  chainId: ChainId;
};

export enum NFTContractTypeName {
  default = 'default',
  zora = 'zora',
  nina = 'nina',
  candyMachine = 'candyMachine'
}

export enum NFTStandard {
  ERC721 = 'erc721',
  METAPLEX = 'metaplex'
}

export type TypeMetadata = {
  other?: any
  overrides: {
    track?: Partial<ProcessedTrack>
    artist?: Partial<ArtistProfile>
    type?: MusicPlatformType
    extractor?: ExtractorTypes
  },
}

export type NftFactory = Contract & {
  platformId: string,
  contractType: NFTContractTypeName,
  name?: string,
  symbol?: string,
  typeMetadata?: TypeMetadata
  standard: NFTStandard
  autoApprove: boolean; // automaticlly approve nfts generated by this facotry
  approved: boolean; // should index nfts generated by this factory
  chainId: ChainId;
}

export type NFTContractType = {
  contractCalls: ValidContractNFTCallFunction[],
  contractMetadataField: ValidContractNFTCallFunction,
  buildNFTId: (contractAddress: string, tokenId: bigint) => string,
}

export const getNFTContractCalls = (nft: NFT, contractTypeName: NFTContractTypeName) => {
  const contractType = NFTFactoryTypes[contractTypeName];
  return contractType?.contractCalls.map(call => {
    return {
      contractAddress: nft.contractAddress,
      callFunction: call,
      callInput: nft.tokenId.toString(),
    };
  });
};

export const getNFTMetadataField = (nft: NFT, field: string) => {
  if (!nft) {
    throw new Error('NFT missing');
  }
  if (!nft.metadata) {
    throw new Error('Missing NFT metadata')
  }
  if (!nft.metadata[field]) {
    throw new Error(`NFT metadata missing ${field}`)
  }
  return nft.metadata[field];
}

export const getTrait = (nft: NFT, type: string) => {
  if (!nft.metadata) {
    console.error({ nft })
    throw new Error('Missing nft metadata');
  }
  if (!nft.metadata.attributes) {
    console.error({ nft })
    throw new Error('Missing attributes');
  }
  const traitAttribute = nft.metadata.attributes.find((attribute: any) => {
    if (!attribute || !attribute.trait_type) {
      console.dir({ nft, type }, { depth: null })
      throw new Error('Unknown attribute/trait');
    }
    return attribute.trait_type.toLowerCase() === type.toLowerCase()
  });
  if (!traitAttribute) {
    throw new Error(`Trait not found: ${type}`);
  }
  return traitAttribute.value;
};

export const getTraitType = (nft: NFT, value: string) => {
  if (!nft.metadata) {
    console.error({ nft })
    throw new Error('Missing nft metadata');
  }
  if (!nft.metadata.attributes) {
    console.error({ nft })
    throw new Error('Missing attributes');
  }
  const traitAttribute = nft.metadata.attributes.find((attribute: any) => {
    if (!attribute || !attribute.value) {
      console.dir({ nft, value }, { depth: null })
      throw new Error('Unknown attribute/trait');
    }
    return attribute.value.toLowerCase() === value.toLowerCase()
  });
  if (!traitAttribute) {
    throw new Error(`Trait value not found: ${value}`);
  }
  return traitAttribute.trait_type;
};
