import { ethers } from 'ethers'

import { formatAddress } from './address'
import { Contract } from './contract'
import { NftFactory, NFTContractTypeName, NFTStandard } from './nft'

export enum MetaFactoryTypeName {
  soundArtistProfileCreator = 'soundArtistProfileCreator',
  ninaMintCreator = 'ninaMintCreator'
}

export type MetaFactory = Contract & {
  platformId: string,
  contractType: MetaFactoryTypeName,
  gap?: string
  standard: NFTStandard; // which type of factories will this metaFactory create
  autoApprove: boolean;
}

export type MetaFactoryType = {
  newContractCreatedEvent: string,
  creationEventToNftFactory?: (event: ethers.Event, approved: boolean) => NftFactory
}

type MetaFactoryTypes = {
  [type in MetaFactoryTypeName]?: MetaFactoryType
}

export const MetaFactoryTypes: MetaFactoryTypes = {
  soundArtistProfileCreator: {
    newContractCreatedEvent: 'CreatedArtist',
    creationEventToNftFactory: (event: any, approved: boolean) => ({
      address: formatAddress(event.args!.artistAddress),
      platformId: 'sound',
      startingBlock: event.blockNumber,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721,
      autoApprove: approved
    })
  }
}