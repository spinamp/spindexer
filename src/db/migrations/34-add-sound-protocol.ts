import { Knex } from 'knex';

import { CrdtMessage, getCrdtUpsertMessage } from '../../types/message';
import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { Table } from '../db';

const SOUND_PROTOCOL_FACTORY: MetaFactory =
  {
    id: '0xaef3e8c8723d9c31863be8de54df2668ef7c4b89',
    platformId: 'sound',
    startingBlock: '15570833',
    contractType: MetaFactoryTypeName.soundCreatorV1,
    gap: '500000',
    standard: NFTStandard.ERC721,
    autoApprove: true,
  }


export const up = async (knex: Knex) => {
  const message: CrdtMessage = getCrdtUpsertMessage<MetaFactory>(Table.metaFactories, SOUND_PROTOCOL_FACTORY);
  await knex(Table.seeds).insert(message);
}

export const down = async (knex: Knex) => {
  throw new Error('nope');
}
