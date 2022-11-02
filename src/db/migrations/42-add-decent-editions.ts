import { Knex } from 'knex';

import { getCrdtUpsertMessage } from '../../types/message';
import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { Table } from '../db';

const DECENT_PLATFORM: MusicPlatform = {
  id: 'decent',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'decent'
}

const DECENT: MetaFactory = {
  id: '0x327793Fa255bdD63C20a4aAD11c3A944A1EA62d6',
  platformId: DECENT_PLATFORM.id,
  contractType: MetaFactoryTypeName.decent,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  startingBlock: '15691421'
}

export const up = async (knex: Knex) => {
  const platformMessage = getCrdtUpsertMessage(Table.platforms, DECENT_PLATFORM, process.env.DEFAULT_ADMIN_ADDRESS )
  const metaFactoryMessage = getCrdtUpsertMessage(Table.metaFactories, DECENT, process.env.DEFAULT_ADMIN_ADDRESS)

  await knex(Table.seeds).insert(platformMessage);
  await knex(Table.seeds).insert(metaFactoryMessage)
}

export const down = async (knex: Knex) => {
  return;
}
