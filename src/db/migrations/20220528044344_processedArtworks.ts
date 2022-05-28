import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  console.log('Running create contracts bootstrap');
  await knex.schema.createTable(Table.processedArtworks, (table: Knex.CreateTableBuilder) => {
    table.increments('id');
    table.string('error');
    table.string('size');
    table.string('trackId');
    table.string('cid');
  });
  await knex.raw(`GRANT SELECT ON "${Table.processedArtworks}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
};

exports.down = async (knex: Knex) => {
  await knex.schema.dropTable(Table.processedArtworks);
}