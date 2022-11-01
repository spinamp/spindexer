import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.mempool, table => {
    table.string('signer');
  })
  await knex(Table.mempool).update({ signer: process.env.DEFAULT_ADMIN_ADDRESS })
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.mempool));
  await knex.schema.alterTable(Table.mempool, table => {
    table.dropColumn('signer');
  });

  await updateViews(knex);
}
