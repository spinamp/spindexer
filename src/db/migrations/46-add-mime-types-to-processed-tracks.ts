import { Knex } from 'knex';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.processedTracks, table => {
    table.string('lossyArtworkMimeType');
    table.string('lossyAudioMimeType');
  })
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.processedTracks));
  await knex.schema.alterTable(Table.processedTracks, table => {
    table.dropColumn('lossyArtworkMimeType');
    table.dropColumn('lossyAudioMimeType');
  });

  await updateViews(knex);
}
