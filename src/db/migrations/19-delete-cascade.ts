import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nfts, table => {
    table.dropForeign('platformId');
    table.foreign('platformId').references('id').inTable(Table.platforms).onDelete('cascade');

  })
}

export const down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nfts, table => {
    table.dropForeign('platformId');
    table.foreign('platformId')

  })
}
