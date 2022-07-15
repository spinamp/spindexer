
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" drop constraint "erc721nftprocesserrors_erc721nftid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" add constraint "erc721nftprocesserrors_erc721nftid_foreign" foreign key ("erc721nftId") references "${Table.erc721nfts}" (id) on delete cascade`);      
}

export const down = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" drop constraint "erc721nftprocesserrors_erc721nftid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" add constraint "erc721nftprocesserrors_erc721nftid_foreign" foreign key ("erc721nftId") references "${Table.erc721nfts}" (id)`);      
}