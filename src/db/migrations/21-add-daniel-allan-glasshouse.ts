
import { Knex } from 'knex';

import { ERC721Contract, ERC721ContractTypeName } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { addPlatform, removeErc721Contract, removePlatform } from '../migration-helpers';

const GLASSHOUSE_PLATFORM = {
  id: '0x719C6d392fc659f4fe9b0576cBC46E18939687a7',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'Daniel Allan',
}

const GLASSHOUSE: ERC721Contract = {
  address: '0x719C6d392fc659f4fe9b0576cBC46E18939687a7',
  startingBlock: '15151004',
  platformId: GLASSHOUSE_PLATFORM.id,
  contractType: ERC721ContractTypeName.default,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Daniel Allan',
        artistId: 'ethereum/0xbcefc4906b443e4db64e2b00b9af2c39e76c785c',
        avatarUrl: 'https://storageapi.fleek.co/catalogworks-team-bucket/prod/users/0xbcefc4906b443e4db64e2b00b9af2c39e76c785c/images/profile_picture.jpeg'
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE platforms add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text, 'mintsongs-v2'::text, 'multi-track-multiprint-contract'::text]))`);
 
  await addPlatform(knex, GLASSHOUSE_PLATFORM, GLASSHOUSE)
}

export const down = async (knex: Knex) => {
  await removeErc721Contract(knex, GLASSHOUSE);
  await removePlatform(knex, GLASSHOUSE_PLATFORM, GLASSHOUSE)

  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE platforms add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text, 'mintsongs-v2'::text]))`);
 
}
