import { Knex } from 'knex';

import { Table } from '../db';

const tableConfig =
{
  name: Table.erc721Transfers, create: (table: Knex.CreateTableBuilder) => {
    table.string('id').primary();
    table.datetime('createdAtTime', { precision: 3 });
    table.bigint('createdAtEthereumBlockNumber');
    table.string('from');
    table.string('to');
    table.string('contractAddress');
    table.string('tokenId');
  }
};

export const up = async (knex: Knex) => {
  await knex.schema.createTable(tableConfig.name, tableConfig.create);
  await knex.raw(`GRANT SELECT ON "${Table.erc721Transfers}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
};

exports.down = async (knex: Knex) => {
  await knex.schema.dropTable(tableConfig.name);
}
