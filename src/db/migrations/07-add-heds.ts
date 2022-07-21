import { Knex } from 'knex';

import { NFTContractTypeName } from '../../types/ethereum';
import { Table } from '../db';

const HEDS_PLATFORM = [
  { id: 'heds', type: 'single-track-multiprint-contract' },
]

const HEDS_CONTRACTS = [
  {
    id: '0xde8a0b17d3dc0468adc65309881d9d6a6cd66372',
    startingBlock: '14193219',
    platformId: 'heds',
    contractType: NFTContractTypeName.default,
  },
  {
    id: '0x5083cf11003f2b25ca7456717e6dc980545002e5',
    platformId: 'heds',
    startingBlock: '14373903',
    contractType: NFTContractTypeName.default,
  },
  {
    id: '0x567e687c93103010962f9e9cf5730ae8dbfc6d41',
    platformId: 'heds',
    startingBlock: '14548643',
    contractType: NFTContractTypeName.default,
  },
  {
    id: '0x8045fd700946a00436923f37d08f280ade3b4af6',
    platformId: 'heds',
    startingBlock: '14813870',
    contractType: NFTContractTypeName.default,
  }
]

export const up = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE platforms add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text]))`);
  await knex(Table.platforms).insert(HEDS_PLATFORM);
  await knex(Table.erc721Contracts).insert(HEDS_CONTRACTS);
};

exports.down = async (knex: Knex) => {
  await knex.raw(`delete from "${Table.erc721nfts}" where "platformId" = 'heds'`)
  const result = await knex.raw(`select cursor from processors where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor['0xde8a0b17d3dc0468adc65309881d9d6a6cd66372'];
  delete parsedCursor['0x5083cf11003f2b25ca7456717e6dc980545002e5'];
  delete parsedCursor['0x567e687c93103010962f9e9cf5730ae8dbfc6d41'];
  delete parsedCursor['0x8045fd700946a00436923f37d08f280ade3b4af6'];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update processors set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);
  await knex.raw(`delete from "${Table.erc721Contracts}" where id in ('0xde8a0b17d3dc0468adc65309881d9d6a6cd66372','0x5083cf11003f2b25ca7456717e6dc980545002e5','0x567e687c93103010962f9e9cf5730ae8dbfc6d41','0x8045fd700946a00436923f37d08f280ade3b4af6')`)
  await knex.raw(`delete from "${Table.platforms}" where id = 'heds'`)
  await knex.raw(`ALTER TABLE "${Table.platforms}" drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text]))`);
}
