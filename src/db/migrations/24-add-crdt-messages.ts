import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.createTable(Table.crdtMessages, table => {
    table.string('timestamp').primary()
    table.string('entityId');
    table.enu('table', Object.values(Table));
    table.string('column')
    table.string('value');
  })

  await knex.schema.createTable(Table.processedMessages, table => {
    table.string('messageId').primary();
    table.enu('table', Object.values(Table));
    table.string('column');
    table.string('entityId');
    table.string('processedAt');
  })

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropView(tableNameToViewName(Table.crdtMessages))
  await knex.schema.dropView(tableNameToViewName(Table.processedMessages))
  await knex.schema.dropTable(Table.crdtMessages);
  await knex.schema.dropTable(Table.processedMessages);

  await updateViews(knex);
}
