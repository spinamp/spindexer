import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  console.log('Running create contracts bootstrap');
  await knex.schema.createTable(Table.ipfsUploads, (table: Knex.CreateTableBuilder) => {
    table.string('error');
    table.string('size');
    table.string('cid');
  });
  await knex.raw(`GRANT SELECT ON "${Table.ipfsUploads}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
};

exports.down = async (knex: Knex) => {
  await knex.schema.dropTable(Table.ipfsUploads);
}
