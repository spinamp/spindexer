import { ethers } from 'ethers'

import { ChainId } from './chain'
import { Contract } from './contract'
import candyMachineType from './metaFactory-types/candyMachine'
import decentType from './metaFactory-types/decent'
import lensType from './metaFactory-types/lens'
import soundArtistProfileCreatorType from './metaFactory-types/soundArtistProfileCreator'
import soundCreatorV1Type from './metaFactory-types/soundCreatorV1'
import zoraDropCreatorType from './metaFactory-types/zoraDropCreator'
import { NftFactory, NFTStandard, TypeMetadata } from './nft'
import { Clients } from './processor'


export enum MetaFactoryTypeName {
  soundArtistProfileCreator = 'soundArtistProfileCreator',
  ninaMintCreator = 'ninaMintCreator',
  zoraDropCreator = 'zoraDropCreator',
  candyMachine = 'candyMachine',
  soundCreatorV1 = 'soundCreatorV1',
  decent = 'decent',
  lens = 'lens'
}

export type MetaFactory = Contract & {
  platformId: string,
  contractType: MetaFactoryTypeName,
  gap?: string
  standard: NFTStandard; // which type of factories will this metaFactory create
  autoApprove: boolean;
  typeMetadata?: TypeMetadata;
  chainId: ChainId;
  address: string;
}

export type MetaFactoryType = {
  newContractCreatedEvent?: string,
  creationMetadataToNftFactory: (creationData: any, autoApprove: boolean, metaFactory: MetaFactory, factoryMetadata?: any) => NftFactory
  metadataAPI?: (events: ethers.Event[], clients: Clients, metaFactory: MetaFactory) => Promise<any>,
}

type MetaFactoryTypes = {
  [type in MetaFactoryTypeName]?: MetaFactoryType
}

export const MetaFactoryTypes: MetaFactoryTypes = {
  soundArtistProfileCreator: soundArtistProfileCreatorType,
  zoraDropCreator: zoraDropCreatorType,
  soundCreatorV1: soundCreatorV1Type,
  candyMachine: candyMachineType,
  decent: decentType,
  lens: lensType
}
