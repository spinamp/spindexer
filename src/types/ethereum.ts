import { ethers } from 'ethers'
import _ from 'lodash'

import { ValidContractCallFunction } from '../clients/ethereum'

import { formatAddress } from './address'
import { MusicPlatform } from './platform'

export const ETHEREUM_NULL_ADDRESS = '0x0000000000000000000000000000000000000000'


export enum FactoryContractTypeName {
  soundArtistProfileCreator = 'soundArtistProfileCreator'
}

export type FactoryContract = {
  address: string,
  platform: MusicPlatform,
  startingBlock: string,
  contractType: FactoryContractTypeName,
}

export type FactoryContractType = {
  newContractCreatedEvent: string,
  creationEventToERC721Contract: (event:ethers.Event) => ERC721Contract
}

type FactoryContractTypes = {
  [type in FactoryContractTypeName]: FactoryContractType
}

export const FactoryContractTypes:FactoryContractTypes = {
  soundArtistProfileCreator: {
    newContractCreatedEvent: 'CreatedArtist',
    creationEventToERC721Contract: (event:any) => ({
      address: event.args!.artistAddress,
      platform: MusicPlatform.sound,
      startingBlock: event.blockNumber,
      contractType: ERC721ContractTypeName.soundArtist,
    })
  },
}

export enum ERC721ContractTypeName {
  default = 'default',
  zora = 'zora',
  soundArtist = 'soundArtist',
}

export type ERC721Contract = {
  address: string,
  platform: MusicPlatform,
  startingBlock: string,
  contractType: ERC721ContractTypeName,
}

export type ERC721ContractType = {
  contractCalls: ValidContractCallFunction[],
  contractMetadataField: ValidContractCallFunction,
  buildNFTId: (contractAddress: string, tokenId: BigInt) => string,
  buildNFTMetadataId: (contractAddress: string, tokenId: BigInt) => string | null,
}

type ERC721ContractTypes = {
  [type in ERC721ContractTypeName] : ERC721ContractType
}

export const NFTContractTypes:ERC721ContractTypes = {
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
  },
  soundArtist: {
    contractCalls: [ValidContractCallFunction.tokenURI],
    contractMetadataField: ValidContractCallFunction.tokenURI,
    buildNFTId: buildERC721Id,
    buildNFTMetadataId: () => null,
  }
}

export function buildERC721Id(contractAddress: string, tokenId: BigInt): string {
  return `${formatAddress(contractAddress)}/${tokenId.toString()}`;
}
