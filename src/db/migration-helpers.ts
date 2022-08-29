import { Knex } from 'knex';

import { MetaFactory } from '../types/metaFactory';
import { NftFactory } from '../types/nft';
import { MusicPlatform, MusicPlatformType } from '../types/platform';

import { Table } from './db';
import { toDBRecords } from './orm';

type NftFactoryAddress = {
  address: string
}

export const addPlatform = async (knex: Knex, platform: MusicPlatform) => {
  const platformTypeCheckConstraintName = `${Table.platforms}_type_check`
  await knex.raw(`ALTER TABLE "${Table.platforms}" drop constraint "${platformTypeCheckConstraintName}"`);
  const validTypes = Object.values(MusicPlatformType).map(type => `'${type}'::text`).join(', ');
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "${platformTypeCheckConstraintName}" CHECK (type = ANY (ARRAY[${validTypes}]))`);

  await knex(Table.platforms).insert([platform]);
}

export const removePlatform = async (knex: Knex, platform: MusicPlatform) => {
  throw 'not implemented'
}

export const addMetaFactory = async(knex: Knex, contract: MetaFactory) => {
  if (!contract.address || contract.address.length === 0) {
    throw new Error('Invalid contract address');
  }
  const dbContracts = toDBRecords(Table.metaFactories, [contract]);
  await knex(Table.metaFactories).insert(dbContracts)
}

export const removeMetaFactory = async(knex: Knex, contract: MetaFactory) => {
  throw 'not implemented'
}

export const addNftFactory = async(knex: Knex, contract: NftFactory) => {
  if (!contract.address || contract.address.length === 0) {
    throw new Error('Invalid contract address');
  }
  const dbContracts = toDBRecords(Table.nftFactories, [contract]);
  await knex(Table.nftFactories).insert(dbContracts)
}

export const clearERC721ContractTracks = async(knex: Knex, contract: NftFactoryAddress) => {
  await knex(Table.nfts_processedTracks)
    .whereILike('nftId', `%${contract.address}%`)
    .del()

  await knex(Table.processedTracks)
    .whereILike('id', `%${contract.address}%`)
    .del()
}

export const clearERC721Contract = async(knex: Knex, contract: NftFactoryAddress) => {
  if (!contract.address || contract.address.length === 0) {
    throw new Error('Invalid contract address');
  }
  const result = await knex.raw(`select cursor from "${Table.processors}" where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor[contract.address.toLowerCase()];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update "${Table.processors}" set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);

  await clearERC721ContractTracks(knex, contract);

  await knex(Table.nftProcessErrors)
    .whereILike('nftId', `%${contract.address}%`)
    .del()
  await knex.raw(`delete from "${Table.erc721Transfers}" where "contractAddress" ilike '${contract.address}';`);
  await knex.raw(`delete from "${Table.nfts}" where "contractAddress" ilike '${contract.address}'`);
}


export const removeNftFactory = async(knex: Knex, contract: NftFactory) => {
  throw 'not implemented'
}
