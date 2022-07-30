import { Knex } from 'knex';

import { MetaFactory, FactoryContractTypeName } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { addMetaFactory, removeMetaFactory } from '../migration-helpers';

const INITIAL_CONTRACTS: MetaFactory[] = [
  {
    address: '0x78e3adc0e811e4f93bd9f1f9389b923c9a3355c2',
    platformId: MusicPlatformType.sound,
    startingBlock: '13725566',
    contractType: FactoryContractTypeName.soundArtistProfileCreator,
    gap: '500000'
  },
]

export const up = async (knex: Knex) => {
  await addMetaFactory(knex, INITIAL_CONTRACTS[0]);
};

exports.down = async (knex: Knex) => {
  await removeMetaFactory(knex, INITIAL_CONTRACTS[0]);
}
