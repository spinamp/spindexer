import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const NFT_FACTORY: NftFactory = {
  id: '0xA2acEd918E8cff703b8BB4129a30146A1Dc35675',
  startingBlock: '15642296',
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
