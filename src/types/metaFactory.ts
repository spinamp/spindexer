import { ethers } from 'ethers'

import { ethereumArtistId } from '../utils/identifiers'

import { formatAddress } from './address'
import { Contract } from './contract'
import { IdExtractorTypes, TitleExtractorTypes } from './fieldExtractor'
import { NftFactory, NFTContractTypeName, NFTStandard } from './nft'
import { MusicPlatformType } from './platform'

export enum MetaFactoryTypeName {
  soundArtistProfileCreator = 'soundArtistProfileCreator',
  ninaMintCreator = 'ninaMintCreator',
  zoraDropCreator = 'zoraDropCreator',
  soundCreatorV1 = 'soundCreatorV1'
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
  creationEventToNftFactory?: (event: ethers.Event, autoApprove: boolean, approved: boolean) => NftFactory
}

type MetaFactoryTypes = {
  [type in MetaFactoryTypeName]?: MetaFactoryType
}

export const MetaFactoryTypes: MetaFactoryTypes = {
  soundArtistProfileCreator: {
    newContractCreatedEvent: 'CreatedArtist',
    creationEventToNftFactory: (event: any, autoApprove: boolean, approved: boolean) => ({
      id: formatAddress(event.args!.artistAddress),
      platformId: 'sound',
      startingBlock: event.blockNumber,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721,
      autoApprove,
      approved
    })
  },
  zoraDropCreator: {
    newContractCreatedEvent: 'CreatedDrop',
    creationEventToNftFactory: (event: any, autoApprove: boolean, approved: boolean) => ({
      id: formatAddress(event.args!.editionContractAddress),
      platformId: 'zora',
      startingBlock: event.blockNumber,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721,
      autoApprove,
      approved,
      typeMetadata: {
        overrides: {
          artist: {
            artistId: ethereumArtistId(event.args!.creator),
            name: formatAddress(event.args!.creator),
          },
          track: {
            websiteUrl: `https://create.zora.co/editions/${formatAddress(event.args!.editionContractAddress)}`
          }
        }
      }
    })
  },
  soundCreatorV1: {
    newContractCreatedEvent: 'SoundEditionCreated',
    creationEventToNftFactory: (event: any, autoApprove: boolean, approved: boolean) => ({
      id: formatAddress(event.args!.soundEdition),
      platformId: 'sound',
      startingBlock: event.blockNumber,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721,
      autoApprove,
      approved: autoApprove,
      typeMetadata: {
        overrides: {
          type: MusicPlatformType['multi-track-multiprint-contract'],
          artist: {
            artistId: ethereumArtistId(event.args!.deployer),
            artistName: 'todo', // get from apitracks
            avatarUrl: 'todo', // get from apitracks
            websiteUrl: 'todo', //get from apitracks
          },
          extractor: {
            id: IdExtractorTypes.CONTRACT_ADDRESS,
            title: TitleExtractorTypes.METADATA_NAME_WITHOUT_LEADING_INFO, // todo -> fix to remove suffix
            artistName: 'todo', // get from apitracks
          }
        }
      }
    })
  }
}
