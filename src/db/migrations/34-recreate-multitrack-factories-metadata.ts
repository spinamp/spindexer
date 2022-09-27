import { Knex } from 'knex';

import { ALBUM_NFT_FACTORY, ARTIFACTS, GLASSHOUSE, HOLLY_PLUS, OTHERS_DIE, THOUGHT_FORMS_NFT_FACTORY } from '../../constants/artistIntegrations';
import { updateNftFactoryTypeMetadataOverrides } from '../migration-helpers';


export const up = async (knex: Knex) => {
  [GLASSHOUSE, THOUGHT_FORMS_NFT_FACTORY, ALBUM_NFT_FACTORY, ARTIFACTS, OTHERS_DIE, HOLLY_PLUS].forEach((contract) => {
    updateNftFactoryTypeMetadataOverrides(knex, contract.id, contract);
  })
}

export const down = async (knex: Knex) => {
  throw new Error('not implemented');
}
