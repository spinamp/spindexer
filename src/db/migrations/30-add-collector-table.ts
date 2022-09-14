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

  await knex.raw(`GRANT SELECT ON "${Table.collectors}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.nftsCollectors}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);

  await knex.schema.dropViewIfExists(tableNameToViewName(Table.nfts));
  await knex.schema.alterTable(Table.nfts, table => {
    table.dropColumn('owner')
  })

  // generate Postgraphile computed-column for nfts owner
  await knex.raw(`
    CREATE FUNCTION ${Table.nfts}_owner(nft raw_nfts) RETURNS varchar AS $$
    SELECT ${Table.collectors}.id
    FROM ${Table.collectors}
    INNER JOIN ${Table.nftsCollectors} ON ${Table.nftsCollectors}."nftId" = nft.id
    $$ LANGUAGE sql STABLE;
  `);

  await knex.raw(`GRANT EXECUTE ON FUNCTION public.raw_nfts_owner(raw_nfts) TO ${process.env.POSTGRES_USERNAME_OPEN}`);


  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.collectors));
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.nftsCollectors));
  await knex.schema.dropTable(Table.collectors);
  await knex.schema.dropTable(Table.nftsCollectors);

  // incomplete down migration
  await knex.schema.alterTable(Table.nfts, table => {
    table.string('owner')
  })
  await updateViews(knex);
}
