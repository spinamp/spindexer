import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721nfts, table => {
    table.jsonb('metadata').alter();
  })
};

exports.down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721nfts, table => {
    table.json('metadata').alter();
  })}
