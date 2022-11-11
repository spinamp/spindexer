import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.artists, table => {
    table.string('address');
    table.string('avatarUrl');
    table.jsonb('externalLinks');
    table.jsonb('theme');
    table.jsonb('spinampLayoutConfig');
  })
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.artists));
  await knex.schema.alterTable(Table.artists, table => {
    table.dropColumn('address');
    table.dropColumn('avatarUrl');
    table.dropColumn('externalLinks');
    table.dropColumn('theme');
    table.dropColumn('spinampLayoutConfig');
  });

  await updateViews(knex);
}
