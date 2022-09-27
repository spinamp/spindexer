import { Knex } from 'knex';

import { JAGWAR_TWIN_PLATFORM, THOUGHT_FORMS_NFT_FACTORY } from '../../constants/artistIntegrations';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';


export const up = async (knex: Knex) => {
  await addPlatform(knex, JAGWAR_TWIN_PLATFORM);
  await addNftFactory(knex, THOUGHT_FORMS_NFT_FACTORY);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, THOUGHT_FORMS_NFT_FACTORY);
  await removePlatform(knex, JAGWAR_TWIN_PLATFORM);
}
