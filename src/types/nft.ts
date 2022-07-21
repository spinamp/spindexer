import { ValidContractNFTCallFunction } from '../clients/ethereum';

import { NFTContractTypeName, NFTContractTypes, NFTStandard } from './ethereum';
import { Record } from './record';

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
}

export type ERC721Transfer = Record & {
  from: string
  to: string
  contractAddress: string
  tokenId: bigint
};

export const getNFTContractCalls = (nft: NFT, contractTypeName: NFTContractTypeName) => {
  const contractType = NFTContractTypes[contractTypeName];
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
    throw new Error('Trait not found');
  }
  return traitAttribute.value;
};
