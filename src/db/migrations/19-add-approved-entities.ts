
import { Knex } from 'knex'

import { Table } from '../db'

export const up = async (knex: Knex) => {

  // add approved column
  await knex.schema.alterTable(Table.metaFactories, table => {
    table.boolean('approved').defaultTo(false)
  })
  await knex.schema.alterTable(Table.nftFactories, table => {
    table.boolean('approved').defaultTo(false)
  })
  await knex.schema.alterTable(Table.nfts, table => {
    table.boolean('approved').defaultTo(false)
  })

  // set all existing entities to approved = true
  await knex(Table.metaFactories).update({ approved: true })
  await knex(Table.nftFactories).update({ approved: true })
  await knex(Table.nfts).update({ approved: true })
}

export const down = async (knex: Knex) => {
 
  await knex.schema.alterTable(Table.metaFactories, table => {
    table.dropColumn('approved')
  })
  await knex.schema.alterTable(Table.nftFactories, table => {
    table.dropColumn('approved')
  })
  await knex.schema.alterTable(Table.nfts, table => {
    table.dropColumn('approved')
  })

}
