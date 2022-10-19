import { Knex } from 'knex';

import { GLASSHOUSE, GLASSHOUSE_PLATFORM } from '../../constants/artistIntegrations';
import { getCrdtUpsertMessage } from '../../types/message';
import { NftFactory } from '../../types/nft';
import { MusicPlatform } from '../../types/platform';
import { Table } from '../db';

export const up = async (knex: Knex) => {
  const platform = getCrdtUpsertMessage<MusicPlatform>(Table.platforms, GLASSHOUSE_PLATFORM);
  const nftFactory = getCrdtUpsertMessage<NftFactory>(Table.nftFactories, GLASSHOUSE);

  await knex(Table.seeds).insert(platform)
  await knex(Table.seeds).insert(nftFactory)
}

export const down = async (knex: Knex) => {
  throw new Error('not implemented');
}
