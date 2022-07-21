import { Knex } from 'knex';

import { Table } from '../db';

const JOIN_TABLE = {
  name: Table.nfts_processedTracks, create: (table: Knex.CreateTableBuilder) => {
    table.string('erc721nftId').references('id').inTable('erc721nfts');
    table.string('processedTrackId').references('id').inTable('processedTracks');
    table.primary(['erc721nftId','processedTrackId']);
  }
};

const ERROR_TABLE = {
  name: Table.nftProcessErrors, create: (table: Knex.CreateTableBuilder) => {
    table.string('erc721nftId').references('id').inTable('erc721nfts');
    table.primary(['erc721nftId']);
    table.string('processError', 3000);
  }
};

export const up = async (knex: Knex) => {
  await knex.schema.createTable(JOIN_TABLE.name, JOIN_TABLE.create);
  await knex.schema.createTable(ERROR_TABLE.name, ERROR_TABLE.create);
  await knex.raw(`GRANT SELECT ON "erc721nfts_processedTracks" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`comment on table "erc721nftProcessErrors" is '@omit';`);
};

exports.down = async (knex: Knex) => {
  await knex.schema.dropTable(JOIN_TABLE.name);
  await knex.schema.dropTable(ERROR_TABLE.name);
}
