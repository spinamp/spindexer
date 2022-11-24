import { Knex } from 'knex';

import { Table } from '../db';
import { updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.processedTracks, table => {
    table.string('lossyArtworkMimeType');
    table.string('lossyAudioMimeType');
  })
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  throw new Error('not implemented');
}
