import { Knex } from 'knex';

import { ERC721ContractTypeName } from '../../types/ethereum';
import { addErc721Contract, removeErc721Contract } from '../migration-helpers';

const HEDS_6 = {
  address: '0x885236535D5Cf7033BdC5bC1050CaD7fdf4970a6',
  startingBlock: '15200392',
  platformId: 'heds',
  contractType: ERC721ContractTypeName.default,
};

export const up = async (knex: Knex) => {
  await addErc721Contract(knex, HEDS_6)
}

export const down = async (knex: Knex) => {
  await removeErc721Contract(knex, HEDS_6)
}