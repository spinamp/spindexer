import { Knex } from 'knex';

import { getCrdtUpsertMessage } from '../../types/message';
import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { Table } from '../db';

const LENS_PLATFORM: MusicPlatform = {
  id: 'lens',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'LENS'
}

const LENS_HUB: MetaFactory = {
  id: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
  platformId: LENS_PLATFORM.id,
  contractType: MetaFactoryTypeName.lens,
  standard: NFTStandard.ERC721,
  autoApprove: false,
  startingBlock: '28384640'
}

export const up = async (knex: Knex) => {
  const platformMessage = getCrdtUpsertMessage(Table.platforms, LENS_PLATFORM, process.env.DEFAULT_ADMIN_ADDRESS )
  const metaFactoryMessage = getCrdtUpsertMessage(Table.metaFactories, LENS_HUB, process.env.DEFAULT_ADMIN_ADDRESS)

  await knex(Table.seeds).insert(platformMessage);
  await knex(Table.seeds).insert(metaFactoryMessage)
}

export const down = async (knex: Knex) => {
  return;
}
