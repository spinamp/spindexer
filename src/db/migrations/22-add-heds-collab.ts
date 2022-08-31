import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

const HEDS_COLLAB_PLATFORM: MusicPlatform =
  { 
    id: 'heds-collab',
    type: MusicPlatformType['hedsCollab'],
    name: 'Heds',
  }

const HEDS_COLLAB_NFT_FACTORY: NftFactory = {
  address: '0xEeB431Caa15B526f48Ee4DB3697FE57EC8223A8e',
  startingBlock: '15416993',
  platformId: HEDS_COLLAB_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, HEDS_COLLAB_PLATFORM);
  await addNftFactory(knex, HEDS_COLLAB_NFT_FACTORY)
}

export const down = async (knex: Knex) => {
  await removePlatform(knex, HEDS_COLLAB_PLATFORM);
  await removeNftFactory(knex, HEDS_COLLAB_NFT_FACTORY)
}
