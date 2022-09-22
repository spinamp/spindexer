import 'dotenv/config';
import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.createTable(Table.collectors, table => {
    table.string('id').notNullable()
    table.primary(['id'])
  } )

  await knex.schema.createTable(Table.nftsCollectors, table => {
    table.string('nftId').references('id').inTable(Table.nfts).onDelete('cascade');
    table.string('collectorId').references('id').inTable(Table.collectors).onDelete('cascade');
    table.integer('amount').defaultTo(1);
    table.primary(['nftId','collectorId']);
    table.unique(['nftId','collectorId']);
  } )

  await knex.schema.alterTable(Table.nfts, table => {
    table.boolean('burned').defaultTo(false);
  });

  await knex.raw(`GRANT SELECT ON "${Table.collectors}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.nftsCollectors}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nftsCollectors, table => {
    table.dropForeign('nftid');
    table.dropForeign('collectorid');
    table.dropPrimary('raw_nfts_collectors_pkey');
    table.dropUnique(['nftId','collectorId']);
  });

  await knex.schema.alterTable(Table.collectors, table => {
    table.dropPrimary('raw_collectors_pkey');
  });

  await knex.schema.dropViewIfExists(tableNameToViewName(Table.collectors));
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.nftsCollectors));
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.nfts));
  await knex.schema.dropTable(Table.collectors);
  await knex.schema.dropTable(Table.nftsCollectors);
  await knex.schema.alterTable(Table.nfts, table => {
    table.dropColumn('burned');
  });

  await updateViews(knex);
}
