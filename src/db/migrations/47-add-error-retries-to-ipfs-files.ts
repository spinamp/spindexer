import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.integer('numberOfRetries').defaultTo(0);
    table.dateTime('lastRetry');
  })
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.ipfsFiles));
  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.dropColumn('numberOfRetries');
    table.dropColumn('lastRetry');
  });
  await updateViews(knex);
}
