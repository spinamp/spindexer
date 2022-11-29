import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.string('mimeType');
    table.boolean('isAudio');
    table.boolean('isVideo');
    table.boolean('isImage');
  })
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.ipfsFiles));
  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.dropColumn('mimeType');
    table.dropColumn('isAudio');
    table.dropColumn('isVideo');
    table.dropColumn('isImage');
  });
  await updateViews(knex);
}
