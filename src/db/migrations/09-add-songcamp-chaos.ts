import { Knex } from 'knex';

import { ERC721ContractTypeName } from '../../types/ethereum';
import { Table } from '../db';

const CHAOS_PLATFORM = [
  { id: 'chaos', type: 'chaos', name: 'Chaos'  },
]

const CHAOS_CONTRACTS = [
  {
    id: '0x1a4756894b4ca61ff1a04658f257f0960ec2d3f8',
    startingBlock: '10766312',
    platformId: 'chaos',
    contractType: ERC721ContractTypeName.default,
  },
]

export const up = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE platforms add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text]))`);
  await knex(Table.platforms).insert(CHAOS_PLATFORM);
  await knex(Table.erc721Contracts).insert(CHAOS_CONTRACTS);
};

exports.down = async (knex: Knex) => {
  await knex.raw(`delete from "${Table.erc721nfts}" where "platformId" = 'chaos'`)
  const result = await knex.raw(`select cursor from processors where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor['0x1a4756894b4ca61ff1a04658f257f0960ec2d3f8'];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update processors set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);
  await knex.raw(`delete from "${Table.erc721Contracts}" where id in ('0x1a4756894b4ca61ff1a04658f257f0960ec2d3f8')`)
  await knex.raw(`delete from "${Table.platforms}" where id = 'chaos'`)
  await knex.raw(`ALTER TABLE "${Table.platforms}" drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text]))`);
}
