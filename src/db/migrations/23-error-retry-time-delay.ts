
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721nftProcessErrors, (table) => {
    table.dateTime('lastRetry')
  })
}

export const down = async (knex: Knex) => {

  await knex.schema.alterTable(Table.erc721nftProcessErrors, (table) => {
    table.dropColumn('lastRetry')
  })

}
