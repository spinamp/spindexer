import { Knex } from 'knex';

import { Table } from '../db';

const PIN_TABLE = {
  name: Table.ipfsPins, create: (table: Knex.CreateTableBuilder) => {
    table.string('id').primary(); //ipfs cid
    table.string('requestId');
    table.string('status');
  }
};

export const up = async (knex: Knex) => {
  await knex.schema.createTable(PIN_TABLE.name, PIN_TABLE.create);
  await knex.raw(`GRANT SELECT ON "ipfsPins" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
};

exports.down = async (knex: Knex) => {
  await knex.schema.dropTable(PIN_TABLE.name);
}
