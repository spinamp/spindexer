import { Knex } from 'knex';

import { ALBUM_NFT_FACTORY } from '../../constants/artistIntegrations';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await addNftFactory(knex, ALBUM_NFT_FACTORY);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, ALBUM_NFT_FACTORY);
}
