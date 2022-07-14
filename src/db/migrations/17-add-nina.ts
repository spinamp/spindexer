
import { Knex } from 'knex';

import { FactoryContract, FactoryContractTypeName } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { Table } from '../db';
import { addFatoryContract, removeFatoryContract, removePlatform } from '../migration-helpers';

const NINA_PLATFORM = {
  id: 'nina',
  type: MusicPlatformType.nina,
  name: 'nina',
}

const NINA: FactoryContract = {
  address: 'ninaN2tm9vUkxoanvGcNApEeWiidLMM2TdBX8HoJuL4',
  platformId: NINA_PLATFORM.id,
  contractType: FactoryContractTypeName.ninaMintCreator
};

export const up = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['nina'::text, 'noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text, 'mintsongs-v2'::text]))`);
  await knex(Table.platforms).insert([NINA_PLATFORM]);
  await addFatoryContract(knex, NINA)
}

export const down = async (knex: Knex) => {
  await knex.raw(`delete from "${Table.erc721nfts}" where "platformId" = '${NINA_PLATFORM.id}'`)
  await knex.raw(`delete from "${Table.erc721Contracts}" where "platformId" = '${NINA_PLATFORM.id}'`)
  await removeFatoryContract(knex, NINA)
  await removePlatform(knex, NINA_PLATFORM, NINA)
  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text, 'mintsongs-v2'::text]))`);
}
