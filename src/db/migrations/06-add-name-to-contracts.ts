import { Knex } from 'knex';

import { Table } from '../db';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table(Table.erc721Contracts, table => {
    table.string('name', 1024);
    table.string('symbol', 256);
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(Table.erc721Contracts, table => {
    table.dropColumn('name');
    table.dropColumn('symbol');
  })
}
