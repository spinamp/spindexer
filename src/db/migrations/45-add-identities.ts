import { Knex } from 'knex';

import { Table } from '../db';
import { updateViews } from '../migration-helpers';


export const up = async (knex: Knex) => {

  await knex.schema.createTable(Table.identities, table => {
    table.string('address').primary();
    table.string('lensProfileId');
    table.string('ensName');
    table.string('lensHandle');
    table.string('ensAvatar');
    table.string('lensAvatar');
  })

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropTable(Table.identities);
  await updateViews(knex);
}
