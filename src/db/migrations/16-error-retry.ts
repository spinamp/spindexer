
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nftProcessErrors, table => {
    table.string('metadataError', 3000),
    table.integer('numberOfRetries').defaultTo(0)
  });

  await knex.schema.alterTable(Table.nfts, table => {
    table.dropColumn('metadataError')
  })
}

export const down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nftProcessErrors, table => {
    table.dropColumn('metadataError'),
    table.dropColumn('numberOfRetries')
  })

  await knex.schema.alterTable(Table.nfts, table => {
    table.string('metadataError', 3000)
  })
}
