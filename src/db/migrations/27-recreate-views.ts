
import { Knex } from 'knex'


export const up = async (knex: Knex) => {
  // this is deprecated (old code recreated views)
}

export const down = async (knex: Knex) => {
  throw new Error('down not implemented');
}
