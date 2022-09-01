import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatformType } from '../../types/platform';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const HEDS_COLLAB_NFT_FACTORY: NftFactory = {
  address: '0xEeB431Caa15B526f48Ee4DB3697FE57EC8223A8e',
  startingBlock: '15416993',
  platformId: 'heds', // part of existing heds platform
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  typeMetadata: {
    overrides: {
      type: MusicPlatformType['hedsCollab'],
    }
  }
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, HEDS_COLLAB_NFT_FACTORY)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, HEDS_COLLAB_NFT_FACTORY)
}
