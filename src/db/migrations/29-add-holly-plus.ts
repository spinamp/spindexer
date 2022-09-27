import { Knex } from 'knex';

import { HOLLY_PLUS, HOLLY_PLUS_PLATFORM } from '../../constants/artistIntegrations';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await addPlatform(knex, HOLLY_PLUS_PLATFORM);
  await addNftFactory(knex, HOLLY_PLUS);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, HOLLY_PLUS);
  await removePlatform(knex, HOLLY_PLUS_PLATFORM);
}
