import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721Transfers, table => {
    table.string('nftId')
    table.foreign('nftId').references('id').inTable(Table.erc721nfts).onDelete('cascade')
  })
};

exports.down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721Transfers, table => {
    table.dropForeign('nftId')
    table.dropColumn('nftId')
  })}
