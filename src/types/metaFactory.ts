import { ethers } from 'ethers'

import { ethereumArtistId } from '../utils/identifiers'

import { formatAddress } from './address'
import { Contract } from './contract'
import { ArtistNameExtractorTypes, AvatarUrlExtractorTypes, IdExtractorTypes, TitleExtractorTypes, WebsiteUrlExtractorTypes } from './fieldExtractor'
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
  creationEventToNftFactory?: (event: ethers.Event, autoApprove: boolean) => NftFactory
}

type MetaFactoryTypes = {
  [type in MetaFactoryTypeName]?: MetaFactoryType
}

export const MetaFactoryTypes: MetaFactoryTypes = {
  soundArtistProfileCreator: {
    newContractCreatedEvent: 'CreatedArtist',
    creationEventToNftFactory: (event: any, autoApprove: boolean) => ({
      id: formatAddress(event.args!.artistAddress),
      platformId: 'sound',
      startingBlock: event.blockNumber,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721,
      autoApprove,
      approved: autoApprove
    })
  },
  zoraDropCreator: {
    newContractCreatedEvent: 'CreatedDrop',
    creationEventToNftFactory: (event: any, autoApprove: boolean) => ({
      id: formatAddress(event.args!.editionContractAddress),
      platformId: 'zora',
      startingBlock: event.blockNumber,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721,
      autoApprove,
      approved: autoApprove,
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
    creationEventToNftFactory: (event: any, autoApprove: boolean) => ({
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
          },
          extractor: {
            id: IdExtractorTypes.TRACK_NUMBER,
            title: TitleExtractorTypes.METADATA_TITLE,
            artistName: ArtistNameExtractorTypes.METADATA_ARTIST,
            avatarUrl: AvatarUrlExtractorTypes.METADATA_IMAGE,
            websiteUrl: WebsiteUrlExtractorTypes.EXTERNAL_URL_WITH_ONLY_FIRST_SEGMENT
          }
        }
      }
    })
  }
}
