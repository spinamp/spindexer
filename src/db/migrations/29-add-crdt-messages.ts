import { Knex } from 'knex';

import { CrdtOperation } from '../../types/message';
import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.createTable(Table.seeds, table => {
    table.increments('id').primary();
    table.dateTime('timestamp');
    table.enu('table', Object.values(Table));
    table.string('column');
    table.string('entityId');
    table.string('value');
    table.enu('operation', Object.values(CrdtOperation));
  })

  await knex.schema.createTable(Table.crdtState, table => {
    table.enu('table', Object.values(Table));
    table.string('column');
    table.string('entityId');
    table.string('value');
    table.dateTime('lastTimestamp');
    table.primary(['table', 'column', 'entityId']);
  })

  await knex.schema.createTable(Table.mempool, table => {
    table.increments('id')
    table.dateTime('timestamp')
    table.enu('table', Object.values(Table));
    table.string('column');
    table.string('entityId');
    table.string('value');
    table.enu('operation', Object.values(CrdtOperation));
  })

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropView(tableNameToViewName(Table.seeds));
  await knex.schema.dropView(tableNameToViewName(Table.crdtState));
  await knex.schema.dropView(tableNameToViewName(Table.mempool));
  await knex.schema.dropTable(Table.seeds);
  await knex.schema.dropTable(Table.crdtState);
  await knex.schema.dropTable(Table.mempool);

  await updateViews(knex);
}
