
import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const HUME_PLATFORM: MusicPlatform = {
  id: 'hume',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'HUME',
}

const VIEW_FROM_THE_MOON: NftFactory = {
  address: '0x09d6e0f30cFdf2f62c1179516B1F980c5D96571E',
  startingBlock: '14962984',
  platformId: HUME_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  typeMetadata: {
    overrides: {
      track: {
        websiteUrl: 'https://www.wearehume.com/'
      },
      artist: {
        name: 'angelbaby'
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, VIEW_FROM_THE_MOON)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, VIEW_FROM_THE_MOON);
}