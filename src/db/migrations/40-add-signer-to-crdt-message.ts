import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';
import { overridesV1 } from '../views';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.seeds, table => {
    table.string('signer');
  })
  await knex(Table.seeds).update({ signer: process.env.DEFAULT_ADMIN_ADDRESS })
  await updateViews(knex, overridesV1);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.seeds));
  await knex.schema.alterTable(Table.seeds, table => {
    table.dropColumn('signer');
  });

  await updateViews(knex, overridesV1);
}
