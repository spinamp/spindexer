import { Knex } from 'knex';

import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addMetaFactory, addPlatform, removeMetaFactory, removePlatform } from '../migration-helpers';

const KOTA_PLATFORM: MusicPlatform = {
  id: 'KOTA',
  type: MusicPlatformType.kota,
  name: 'KOTA',
}

const KOTA: MetaFactory = {
  id: '77mdgiHVzXKnftuP8tssFQv2YEmM1iiiiAZwCkWnRL3G',
  platformId: KOTA_PLATFORM.id,
  contractType: MetaFactoryTypeName.candyMachine,
  standard: NFTStandard.METAPLEX,
  autoApprove: true,
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, KOTA_PLATFORM);
  await addMetaFactory(knex, KOTA);
}

export const down = async (knex: Knex) => {
  await removeMetaFactory(knex, KOTA);
  await removePlatform(knex, KOTA_PLATFORM);
}
