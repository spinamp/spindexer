import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const HEDS_6: NftFactory = {
  address: '0x20f2717f113d0b3815124876f3d72f8e1179341e',
  startingBlock: '15373455',
  platformId: 'heds',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, HEDS_6)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, HEDS_6)
}
