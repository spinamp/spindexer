
import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addPlatform, addNftFactory, removeNftFactory, removePlatform } from '../migration-helpers';

const HUME_PLATFORM: MusicPlatform = {
  id: 'hume',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'HUME',
}

const OTHERSIDE: NftFactory = {
  address: '0x0301E208Ec282EC38934606EF53dBD5876ED7eB0',
  startingBlock: '14886522',
  platformId: HUME_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  typeMetadata: {
    overrides: {
      track: {
        websiteUrl: 'https://www.wearehume.com/'
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, HUME_PLATFORM)
  await addNftFactory(knex, OTHERSIDE)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, OTHERSIDE);
  await removePlatform(knex, HUME_PLATFORM)
}
