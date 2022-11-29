import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nfts, table => {
    table.datetime('publicReleaseTime', { precision: 3 });
  })
}

export const down = async (knex: Knex) => {
  throw new Error('nope');
}
