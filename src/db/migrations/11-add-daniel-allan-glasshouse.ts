import { Knex } from 'knex';

import { GLASSHOUSE_PLATFORM, GLASSHOUSE } from '../../constants/artistIntegrations';
import { addPlatform, addNftFactory, removeNftFactory, removePlatform } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await addPlatform(knex, GLASSHOUSE_PLATFORM)
  await addNftFactory(knex, GLASSHOUSE)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, GLASSHOUSE);
  await removePlatform(knex, GLASSHOUSE_PLATFORM)
}
