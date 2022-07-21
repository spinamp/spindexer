import { Knex } from 'knex';

import { NFTContractTypeName } from '../../types/ethereum';
import { Table } from '../db';

const CHAOS_PLATFORM = [
  { id: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349', type: 'chaos', name: 'Chaos'  },
]

const CHAOS_CONTRACTS = [
  {
    id: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349',
    startingBlock: '10766312',
    platformId: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349',
    contractType: NFTContractTypeName.default,
  },
]

export const up = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE platforms add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text]))`);
  await knex(Table.platforms).insert(CHAOS_PLATFORM);
  await knex(Table.erc721Contracts).insert(CHAOS_CONTRACTS);
};

exports.down = async (knex: Knex) => {
  await knex.raw(`delete from "${Table.erc721nfts}" where "platformId" = '0x8427e46826a520b1264b55f31fcb5ddfdc31e349'`)
  const result = await knex.raw(`select cursor from processors where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor['0x8427e46826a520b1264b55f31fcb5ddfdc31e349'];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update processors set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);
  await knex.raw(`delete from "${Table.erc721Contracts}" where id in ('0x8427e46826a520b1264b55f31fcb5ddfdc31e349')`)
  await knex.raw(`delete from "${Table.platforms}" where id = '0x8427e46826a520b1264b55f31fcb5ddfdc31e349'`)
  await knex.raw(`ALTER TABLE "${Table.platforms}" drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text]))`);
}
