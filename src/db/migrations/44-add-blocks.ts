import { Knex } from 'knex';

import { Table } from '../db';
import { updateViews } from '../migration-helpers';


export const up = async (knex: Knex) => {

  await knex.schema.createTable(Table.blocks, table => {
    table.string('blockNumber');
    table.dateTime('timestamp', { precision: 3 })
    table.string('chainId').references('id').inTable(Table.chains).onDelete('cascade');
    table.primary(['blockNumber', 'chainId'])
  })

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  return;
}