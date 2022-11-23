
import { Knex } from 'knex'

import { updateViews } from '../migration-helpers'
import { overridesV1 } from '../views';

export const up = async (knex: Knex) => {
  await updateViews(knex, overridesV1);
}

export const down = async (knex: Knex) => {
  throw new Error('down not implemented');
}
