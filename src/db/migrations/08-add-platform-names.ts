import { Knex } from 'knex';

import { Table } from '../db';

const PLATFORM_NAME_UPDATES = [
  { id: 'heds', name: 'Heds' },
  { id: 'catalog', name: 'Catalog' },
  { id: 'noizd', name: 'NOIZD' },
  { id: 'sound', name: 'Sound.xyz' },
  { id: 'zora', name: 'Zora' },
]

export const up = async (knex: Knex) => {

  await knex.schema.table(Table.platforms, table => {
    table.string('name', 1024);
  })

  for (let i = 0; i < PLATFORM_NAME_UPDATES.length; i++) {
    const { id, name } = PLATFORM_NAME_UPDATES[i];
    await knex(Table.platforms).where('id', id).update('name', name);
  }

  await knex.schema.alterTable(Table.platforms, table => {
    table.string('name', 1024).notNullable().alter();
  })

};

exports.down = async (knex: Knex) => {
  throw new Error('not implemented');
}
