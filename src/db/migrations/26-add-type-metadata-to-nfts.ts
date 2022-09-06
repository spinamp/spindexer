import { Knex } from 'knex';
import 'dotenv/config';

import { Table } from '../db'
import { tableNameToViewName, updateViews } from '../migration-helpers';


export async function up(knex: Knex): Promise<void> {
  const shouldAlterNfts = !(await knex.schema.hasColumn(Table.nfts, 'typeMetadata'))

  if (shouldAlterNfts) {
    await knex.schema.alterTable(Table.nfts, table => {
      table.jsonb('typeMetadata')
    })
  }

  await updateViews(knex);
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropView(tableNameToViewName(Table.nfts));
  await knex.schema.alterTable(Table.nfts, table => {
    table.dropColumn('typeMetadata')
  })
}
