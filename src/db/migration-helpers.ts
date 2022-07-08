import { Knex } from 'knex';

import { MusicPlatform } from '../types/platform';

import { Table } from './db';
import { toDBRecords } from './orm';

type ERC721ContractAddress = {
  address: string
}

export const addPlatform = async (knex: Knex, platform: MusicPlatform, contract: ERC721ContractAddress) => {
  await knex(Table.platforms).insert([platform]);
  const dbContracts = toDBRecords(Table.erc721Contracts, [contract])
  await knex(Table.erc721Contracts).insert(dbContracts);
}

export const removePlatform = async (knex: Knex, platform: MusicPlatform, contract: ERC721ContractAddress) => {
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

export const addErc721Contract = async(knex: Knex, contract: ERC721ContractAddress) => {
  if (!contract.address || contract.address.length === 0) {
    throw new Error('Invalid contract address');
  }
  const dbContracts = toDBRecords(Table.erc721Contracts, [contract]);
  await knex(Table.erc721Contracts).insert(dbContracts)
}

export const clearERC721ContractTracks = async(knex: Knex, contract: ERC721ContractAddress) => {
  await knex(Table.erc721nfts_processedTracks)
    .whereILike('erc721nftId', `%${contract.address}%`)
    .del()

  await knex(Table.processedTracks)
    .whereILike('id', `%${contract.address}%`)
    .del()
}

export const clearERC721Contract = async(knex: Knex, contract: ERC721ContractAddress) => {
  if (!contract.address || contract.address.length === 0) {
    throw new Error('Invalid contract address');
  }
  const result = await knex.raw(`select cursor from processors where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor[contract.address.toLowerCase()];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update processors set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);

  clearERC721ContractTracks(knex, contract);

  await knex(Table.erc721nftProcessErrors)
    .whereILike('erc721nftId', `%${contract.address}%`)
    .del()
  await knex.raw(`delete from "${Table.erc721Transfers}" where "contractAddress" ilike '${contract.address}';`);
  await knex.raw(`delete from "${Table.erc721nfts}" where "contractAddress" ilike '${contract.address}'`);
}


export const removeErc721Contract = async(knex: Knex, contract: ERC721ContractAddress) => {
  clearERC721Contract(knex, contract);
  await knex.raw(`delete from "${Table.erc721Contracts}" where id ilike '${contract.address}';`);
}
