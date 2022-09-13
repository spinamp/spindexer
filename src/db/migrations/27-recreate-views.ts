
import { Knex } from 'knex'

import { updateViews } from '../migration-helpers'

export const up = async (knex: Knex) => {
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  throw new Error('down not implemented');
}
