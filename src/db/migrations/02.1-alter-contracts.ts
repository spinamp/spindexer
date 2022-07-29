
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721Contracts, table => {
    table.jsonb('typeMetadata')
  })
}

export const down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721Contracts, table => {
    table.dropColumn('typeMetadata')
  })
}
