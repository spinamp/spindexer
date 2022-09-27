import { Knex } from 'knex';

import { ARTIFACTS } from '../../constants/artistIntegrations';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await addNftFactory(knex, ARTIFACTS);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, ARTIFACTS);
}
