import { Knex } from 'knex';

import { Table } from '../db';
import { updateViews } from '../migration-helpers';
import { overridesV1 } from '../views';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.nfts, table => {
    table.datetime('publicReleaseTime', { precision: 3 });
  })

  await updateViews(knex, overridesV1);
}

export const down = async (knex: Knex) => {
  throw new Error('nope');
}
