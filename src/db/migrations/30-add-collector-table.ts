import 'dotenv/config';
import { Knex } from 'knex';

import { Table } from '../db';
import { updateViews } from '../migration-helpers';

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
  } )

  await knex.raw(`
    INSERT INTO ${Table.collectors} (id)
    SELECT DISTINCT owner
    FROM ${Table.nfts}
    WHERE owner IS NOT null;
  `)

  await knex.raw(`
    INSERT INTO ${Table.nftsCollectors} ("nftId", "collectorId")
    SELECT DISTINCT id, owner
    FROM ${Table.nfts}
    WHERE owner IS NOT null;
  `)

  await knex.raw(`GRANT SELECT ON "${Table.collectors}" TO ${'open_access'}`);
  await knex.raw(`GRANT SELECT ON "${Table.nftsCollectors}" TO ${'open_access'}`);

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropTable(Table.collectors);
  await knex.schema.dropTable(Table.nftsCollectors);
}
