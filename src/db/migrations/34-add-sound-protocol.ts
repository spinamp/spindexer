import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nftProcessErrors, table => {
    table.string('processErrorName');
  });
}

export const down = async (knex: Knex) => {
  throw new Error('nope');
}
