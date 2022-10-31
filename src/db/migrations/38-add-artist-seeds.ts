import { Knex } from 'knex';

import { PLATFORMS, FACTORIES, META_FACTORIES } from '../../constants/artistIntegrations';
import { CrdtOperation } from '../../types/message';
import { Table } from '../db';

export const up = async (knex: Knex) => {
  const platforms: any[] = PLATFORMS.map((platform) => ({
    timestamp: new Date(),
    table: Table.platforms,
    data: platform,
    operation: CrdtOperation.UPSERT,
  }))

  const factories: any[] = FACTORIES.map((factory) => ({
    timestamp: new Date(),
    table: Table.nftFactories,
    data: factory,
    operation: CrdtOperation.UPSERT,
  }))

  const metaFactories: any[] = META_FACTORIES.map((metaFactory) => ({
    timestamp: new Date(),
    table: Table.metaFactories,
    data: metaFactory,
    operation: CrdtOperation.UPSERT,
  }))

  await knex(Table.seeds).insert(platforms)
  await knex(Table.seeds).insert(factories)
  await knex(Table.seeds).insert(metaFactories)
}

export const down = async (knex: Knex) => {
  await knex(Table.seeds).truncate();
}
