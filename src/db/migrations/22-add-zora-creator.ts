import { Knex } from 'knex';

import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { addMetaFactory, removeMetaFactory } from '../migration-helpers';

const ZORA_CREATOR_FACTORY: MetaFactory = 
  {
    address: '0xf74b146ce44cc162b601dec3be331784db111dc1',
    platformId: 'zora',
    startingBlock: '14758779',
    contractType: MetaFactoryTypeName.zoraDropCreator,
    gap: '500000',
    standard: NFTStandard.ERC721,
    autoApprove: false
  }

export const up = async (knex: Knex) => {
  await addMetaFactory(knex, ZORA_CREATOR_FACTORY);
};

exports.down = async (knex: Knex) => {
  await removeMetaFactory(knex, ZORA_CREATOR_FACTORY);
}
