import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const HEDS_5: NftFactory = {
  address: '0x8f36eb094f7b960a234a482d4d8ffb8b37f728c6',
  startingBlock: '14986141',
  platformId: 'heds',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true

};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, HEDS_5)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, HEDS_5)
}