import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

const CHAOS_PLATFORM: MusicPlatform = { 
  id: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349',
  type: MusicPlatformType.chaos,
  name: 'Chaos',
}

const CHAOS_CONTRACT: NftFactory = {
  id: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349',
  startingBlock: '10766312',
  platformId: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true

}

export const up = async (knex: Knex) => {
  await addPlatform(knex, CHAOS_PLATFORM);
  await addNftFactory(knex, CHAOS_CONTRACT);
};

exports.down = async (knex: Knex) => {
  await removePlatform(knex, CHAOS_PLATFORM);
  await removeNftFactory(knex, CHAOS_CONTRACT);

}
