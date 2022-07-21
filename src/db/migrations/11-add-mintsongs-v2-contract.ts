import { Knex } from 'knex';

import { NFTContractTypeName } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { addPlatform, removePlatform } from '../migration-helpers';

const PLATFORM = { id: 'mintsongs', type: MusicPlatformType.mintsongsV2, name: 'Mintsongs' }

const CONTRACT = {
  address: '0x2B5426A5B98a3E366230ebA9f95a24f09Ae4a584',
  startingBlock: '14793510',
  platformId: 'mintsongs',
  contractType: NFTContractTypeName.default,
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, PLATFORM, CONTRACT);
}

export const down = async (knex: Knex) => {
  await removePlatform(knex, PLATFORM, CONTRACT);
}
