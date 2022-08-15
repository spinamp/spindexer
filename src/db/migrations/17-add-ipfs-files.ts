
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.createTable(Table.ipfsFiles, table => {
    table.string('url').notNullable()
    table.string('cid').nullable()
    table.string('error').nullable()
    table.primary(['url'])
  } )
}

export const down = async (knex: Knex) => {
  await knex.schema.dropTable(Table.ipfsFiles)
}
