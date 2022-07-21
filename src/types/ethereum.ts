import { ethers } from 'ethers'

import { ValidContractNFTCallFunction } from '../clients/ethereum'

import { formatAddress } from './address'
import { ArtistProfile } from './artist'
import { ProcessedTrack } from './track'

export const ETHEREUM_NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export type Contract = {
  address: string,
  startingBlock?: string,
}

export enum FactoryContractTypeName {
  soundArtistProfileCreator = 'soundArtistProfileCreator',
  ninaMintCreator = 'ninaMintCreator'
}

export type FactoryContract = Contract & {
  platformId: string,
  contractType: FactoryContractTypeName,
  gap?: string
}

export type FactoryContractType = {
  newContractCreatedEvent: string,
  creationEventToNftFactory?: (event: ethers.Event) => NftFactory
}

type FactoryContractTypes = {
  [type in FactoryContractTypeName]?: FactoryContractType
}

export const FactoryContractTypes: FactoryContractTypes = {
  soundArtistProfileCreator: {
    newContractCreatedEvent: 'CreatedArtist',
    creationEventToNftFactory: (event: any) => ({
      address: formatAddress(event.args!.artistAddress),
      platformId: 'sound',
      startingBlock: event.blockNumber,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721
    })
  }
}

export enum NFTContractTypeName {
  default = 'default',
  zora = 'zora',
  nina = 'nina'
}

export enum NFTStandard {
  ERC721 = 'erc721',
  METAPLEX = 'metaplex'
}

export type TypeMetadata = {
  overrides: {
    track?: Partial<ProcessedTrack>,
    artist?: Partial<ArtistProfile>
  }
}

export type NftFactory = Contract & {
  platformId: string,
  contractType: NFTContractTypeName,
  name?: string,
  symbol?: string,
  typeMetadata?: TypeMetadata
  standard: NFTStandard
}

export type NFTContractType = {
  contractCalls: ValidContractNFTCallFunction[],
  contractMetadataField: ValidContractNFTCallFunction,
  buildNFTId: (contractAddress: string, tokenId: bigint) => string,
}

type ERC721ContractTypes = {
  [type in NFTContractTypeName]?: NFTContractType
}

export const NFTContractTypes: ERC721ContractTypes = {
  default: {
    contractCalls: [ValidContractNFTCallFunction.tokenURI],
    contractMetadataField: ValidContractNFTCallFunction.tokenURI,
    buildNFTId: buildERC721Id,
  },
  zora: {
    contractCalls: [ValidContractNFTCallFunction.tokenURI, ValidContractNFTCallFunction.tokenMetadataURI],
    contractMetadataField: ValidContractNFTCallFunction.tokenMetadataURI,
    buildNFTId: buildERC721Id,
  }
}

export function buildERC721Id(contractAddress: string, tokenId: bigint): string {
  return `${formatAddress(contractAddress)}/${tokenId.toString()}`;
}
