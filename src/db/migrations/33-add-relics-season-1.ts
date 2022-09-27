import { Knex } from 'knex';

import { RELICS_YXZ, SEASONS_1 } from '../../constants/artistIntegrations';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await addPlatform(knex, RELICS_YXZ);
  await addNftFactory(knex, SEASONS_1);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, SEASONS_1);
  await removePlatform(knex, RELICS_YXZ);
}
