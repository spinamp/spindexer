import { Knex } from 'knex';

import { MIGHTY_33, OTHERS_DIE } from '../../constants/artistIntegrations';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await addPlatform(knex, MIGHTY_33);
  await addNftFactory(knex, OTHERS_DIE);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, OTHERS_DIE);
  await removePlatform(knex, MIGHTY_33);
}
