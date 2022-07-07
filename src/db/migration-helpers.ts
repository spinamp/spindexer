import { Knex } from 'knex';

import { ERC721Contract } from '../types/ethereum';
import { MusicPlatform } from '../types/platform';

import { Table } from './db';
import { toDBRecords } from './orm';

export const addPlatform = async (knex: Knex, platform: MusicPlatform, contract: ERC721Contract) => {
  await knex(Table.platforms).insert([platform]);
  const dbContracts = toDBRecords(Table.erc721Contracts, [contract])
  await knex(Table.erc721Contracts).insert(dbContracts);
}

export const removePlatform = async (knex: Knex, platform: MusicPlatform, contract: ERC721Contract) => {
  await knex.raw(`delete from "${Table.erc721nfts}" where "platformId" = '${platform.id}'`)
  const result = await knex.raw(`select cursor from processors where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor[contract.address.toLowerCase()];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update processors set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);
  await knex.raw(`delete from "${Table.erc721Contracts}" where "platformId" = '${platform.id}'`);
  await knex.raw(`delete from "${Table.artistProfiles}" where "platformId" = '${platform.id}'`)  
  await knex.raw(`delete from "${Table.platforms}" where id = '${platform.id}'`)

}

export const addErc721Contract = async(knex: Knex, contract: ERC721Contract) => {
  if (!contract.address || contract.address.length === 0) {
    throw new Error('Invalid contract address');
  }
  const dbContracts = toDBRecords(Table.erc721Contracts, [contract]);
  await knex(Table.erc721Contracts).insert(dbContracts)
}

export const removeErc721Contract = async(knex: Knex, contract: ERC721Contract) => {
  if (!contract.address || contract.address.length === 0) {
    throw new Error('Invalid contract address');
  }
  const result = await knex.raw(`select cursor from processors where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor[contract.address.toLowerCase()];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update processors set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);

  await knex(Table.erc721nfts_processedTracks)
    .whereILike('erc721nftId', `%${contract.address}%`)
    .del()

  await knex(Table.processedTracks)
    .whereILike('id', `%${contract.address}%`)
    .del()
  
  await knex(Table.erc721nftProcessErrors)
    .whereILike('erc721nftId', `%${contract.address}%`)
    .del()
  await knex.raw(`delete from "${Table.erc721Transfers}" where "contractAddress" = '${contract.address}';`);
  await knex.raw(`delete from "${Table.erc721nfts}" where "contractAddress" = '${contract.address}'`);
  await knex.raw(`delete from "${Table.erc721Contracts}" where id = '${contract.address}';`);
}
