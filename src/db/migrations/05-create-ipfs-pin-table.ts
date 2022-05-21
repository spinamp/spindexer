import { Knex } from 'knex';

import { Table } from '../db';

const PIN_TABLE = {
  name: Table.ipfsPins, create: (table: Knex.CreateTableBuilder) => {
    table.string('id').primary(); //ipfs cid
    table.string('requestId');
    table.string('status');
  }
};

const TRACK_PINS = {
  name: Table.processedTracks_ipfsPins, create: (table: Knex.CreateTableBuilder) => {
    table.string('processedTrackId').references('id').inTable(Table.processedTracks);
    table.boolean('artworkPinned');
    table.boolean('audioPinned');
  }
};

export const up = async (knex: Knex) => {
  await knex.schema.createTable(PIN_TABLE.name, PIN_TABLE.create);
  await knex.schema.createTable(TRACK_PINS.name, TRACK_PINS.create);
  await knex.raw(`GRANT SELECT ON "ipfsPins" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "processedTracks_ipfsPins" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
};

exports.down = async (knex: Knex) => {
  await knex.schema.dropTable(TRACK_PINS.name);
  await knex.schema.dropTable(PIN_TABLE.name);
}
