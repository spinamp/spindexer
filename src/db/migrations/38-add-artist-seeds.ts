import { Knex } from 'knex';

import { PLATFORMS, FACTORIES, META_FACTORIES } from '../../constants/artistIntegrations';
import { defaultAdminAddress } from '../../constants/defaults';
import { CrdtUpsertMessage, getCrdtUpsertMessage } from '../../types/message';
import { MetaFactory } from '../../types/metaFactory';
import { NftFactory } from '../../types/nft';
import { MusicPlatform } from '../../types/platform';
import { Table } from '../db';

export const up = async (knex: Knex) => {
  const platforms: CrdtUpsertMessage[] = PLATFORMS.map((platform) =>
    getCrdtUpsertMessage<MusicPlatform>(Table.platforms, platform, defaultAdminAddress())
  )

  const factories: CrdtUpsertMessage[] = FACTORIES.map((factory) =>
    getCrdtUpsertMessage<NftFactory>(Table.nftFactories, factory, defaultAdminAddress())
  )

  const metaFactories: CrdtUpsertMessage[] = META_FACTORIES.map((metaFactory) =>
    getCrdtUpsertMessage<MetaFactory>(Table.metaFactories, metaFactory, defaultAdminAddress())
  )

  await knex(Table.seeds).insert(platforms)
  await knex(Table.seeds).insert(factories)
  await knex(Table.seeds).insert(metaFactories)
}

export const down = async (knex: Knex) => {
  await knex(Table.seeds).truncate();
}
