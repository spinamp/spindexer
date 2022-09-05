import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addPlatform, addNftFactory, removePlatform, removeNftFactory } from '../migration-helpers';

const PLATFORM: MusicPlatform = { id: 'mintsongs', type: MusicPlatformType.mintsongsV2, name: 'Mintsongs' }

const CONTRACT: NftFactory = {
  id: '0x2B5426A5B98a3E366230ebA9f95a24f09Ae4a584',
  startingBlock: '14793510',
  platformId: 'mintsongs',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true

};

export const up = async (knex: Knex) => {
  await addPlatform(knex, PLATFORM);
  await addNftFactory(knex, CONTRACT);
}

export const down = async (knex: Knex) => {
  await removePlatform(knex, PLATFORM);
  await removeNftFactory(knex, CONTRACT);
}
