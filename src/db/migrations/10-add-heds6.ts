import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const HEDS_6: NftFactory = {
  id: '0x885236535D5Cf7033BdC5bC1050CaD7fdf4970a6',
  startingBlock: '15200392',
  platformId: 'heds',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, HEDS_6)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, HEDS_6)
}