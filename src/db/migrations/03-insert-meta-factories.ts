import { Knex } from 'knex';

import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { addMetaFactory, removeMetaFactory } from '../migration-helpers';

const INITIAL_CONTRACTS: MetaFactory[] = [
  {
    address: '0x78e3adc0e811e4f93bd9f1f9389b923c9a3355c2',
    platformId: 'sound',
    startingBlock: '13725566',
    contractType: MetaFactoryTypeName.soundArtistProfileCreator,
    gap: '500000',
    standard: NFTStandard.ERC721,
    approved: true
  },
]

export const up = async (knex: Knex) => {
  await addMetaFactory(knex, INITIAL_CONTRACTS[0]);
};

exports.down = async (knex: Knex) => {
  await removeMetaFactory(knex, INITIAL_CONTRACTS[0]);
}
