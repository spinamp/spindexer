
import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const HUME_PLATFORM: MusicPlatform = {
  id: 'hume',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'HUME',
}

const MINTED: NftFactory = {
  address: '0x8056B7750D2A061757a0ECA13eEf78caeDD4a30F',
  startingBlock: '15121180',
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
  await addNftFactory(knex, MINTED)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, MINTED);
}
