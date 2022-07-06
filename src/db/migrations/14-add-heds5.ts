import { Knex } from 'knex';

import { ERC721ContractTypeName } from '../../types/ethereum';
import { addErc721Contract, removeErc721Contract } from '../migration-helpers';

const HEDS_5 = {
  address: '0x8f36eb094f7b960a234a482d4d8ffb8b37f728c6',
  startingBlock: '14986141',
  platformId: 'heds',
  contractType: ERC721ContractTypeName.default,
};

export const up = async (knex: Knex) => {
  await addErc721Contract(knex, HEDS_5)
}

export const down = async (knex: Knex) => {
  await removeErc721Contract(knex, HEDS_5)
}