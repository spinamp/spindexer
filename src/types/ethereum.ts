import _ from 'lodash'

import { ValidContractCallFunction } from '../clients/ethereum'

import { formatAddress } from './address'
import { MusicPlatform } from './platform'

export const ETHEREUM_NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export type ERC721Contract = {
  address: string,
  platform: MusicPlatform,
  startingBlock: string,
  contractType: ContractTypeName,
}

type NFTContractTypes = {
  [type:string] : {
    contractCalls: ValidContractCallFunction[],
    contractMetadataField: ValidContractCallFunction,
    buildNFTId: (contractAddress: string, tokenId: BigInt) => string,
    buildNFTMetadataId: (contractAddress: string, tokenId: BigInt) => string,
    }
}

export const NFTContractTypes:NFTContractTypes = {
  default: {
    contractCalls: [ValidContractCallFunction.tokenURI],
    contractMetadataField: ValidContractCallFunction.tokenURI,
    buildNFTId: buildERC721Id,
    buildNFTMetadataId: buildERC721Id,
  },
  zora: {
    contractCalls: [ValidContractCallFunction.tokenURI, ValidContractCallFunction.tokenMetadataURI],
    contractMetadataField: ValidContractCallFunction.tokenMetadataURI,
    buildNFTId: buildERC721Id,
    buildNFTMetadataId: buildERC721Id,
  }
}

export function buildERC721Id(contractAddress: string, tokenId: BigInt): string {
  return `${formatAddress(contractAddress)}/${tokenId.toString()}`;
}

export enum ContractTypeName {
  default = 'default',
  zora = 'zora'
}

export const ZoraContract:ERC721Contract = {
  address: '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7',
  platform: MusicPlatform.zora,
  startingBlock: '11565020',
  contractType: ContractTypeName.zora,
};

export const NOIZDContract:ERC721Contract = {
  address: '0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6',
  platform: MusicPlatform.noizd,
  startingBlock: '13470560',
  contractType: ContractTypeName.default,
};

export const NewCatalogContract:ERC721Contract = {
  address: '0x0bc2a24ce568dad89691116d5b34deb6c203f342',
  platform: MusicPlatform.catalog,
  startingBlock: '14566825',
  contractType: ContractTypeName.default,
};

export const ERC721_CONTRACTS = [
  ZoraContract,
  NOIZDContract,
  NewCatalogContract,
]

export const CONTRACTS_BY_ADDRESS = _.keyBy(ERC721_CONTRACTS, 'address')
