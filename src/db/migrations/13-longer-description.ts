import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.processedTracks, table => {
    table.string('description', 50000).alter();
  })
};

exports.down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.processedTracks, table => {
    table.string('description', 10000).alter();
  })}
