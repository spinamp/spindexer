
import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform } from '../migration-helpers';

const ANOTHERBLOCK_PLATFORM: MusicPlatform = {
  id: 'anotherblock',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'anotherblock',
}

const ANOTHERBLOCK: NftFactory = {
  address: '0x9ef75b412d8466b9b35f3a1bf7a809a5c6d0aa7c',
  startingBlock: '15320924',
  platformId: ANOTHERBLOCK_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  typeMetadata: {
    overrides: {
      track: {
        websiteUrl: 'https://anotherblock.io/weekend-on-a-tuesday',
        title: 'Weekend on a Tuesday',
        lossyAudioIPFSHash: 'QmYDoCuj8wcSSr5okZXLfc5eFQNDdNy7sBTQWQYts9vrRy', 
        lossyArtworkURL: 'https://i.scdn.co/image/ab67616d0000b273b26e03e40aab84270dbcd972'
      },
      artist: {
        name: 'r3hab & laidback luke',
        artistId: 'r3hab & laidback luke',
        platformInternalId: 'r3hab & laidback luke',
        avatarUrl: 'https://themusicessentials.com/wp-content/uploads/2022/08/R3HAB-WEEKEND-ON-A-TUESDAY-e1660897451989-1068x756.jpg.webp',
        websiteUrl: 'https://www.anotherblock.io/',
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, ANOTHERBLOCK_PLATFORM)
  await addNftFactory(knex, ANOTHERBLOCK)
}

export const down = async (knex: Knex) => {
  // await removePlatform(knex, ANOTHERBLOCK_PLATFORM)
  // await removeNftFactory(knex, ANOTHERBLOCK);
}
