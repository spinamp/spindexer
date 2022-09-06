import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const NFT_FACTORY: NftFactory = {
  id: '0x20f2717f113d0b3815124876f3d72f8e1179341e',
  startingBlock: '15373455',
  platformId: 'heds',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, NFT_FACTORY)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, NFT_FACTORY)
}
