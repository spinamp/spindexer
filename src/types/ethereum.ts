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

export type NFTContractType = {
  contractCalls: ValidContractCallFunction[],
  contractMetadataField: ValidContractCallFunction,
  buildNFTId: (contractAddress: string, tokenId: BigInt) => string,
  buildNFTMetadataId: (contractAddress: string, tokenId: BigInt) => string,
}

type NFTContractTypes = {
  [type:string] : NFTContractType
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
