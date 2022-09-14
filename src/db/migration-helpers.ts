import { Knex } from 'knex';

import { MetaFactory } from '../types/metaFactory';
import { NftFactory } from '../types/nft';
import { MusicPlatform, MusicPlatformType } from '../types/platform';

import { Table } from './db';
import { toDBRecords } from './orm';
import { overrides } from './views';

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
  if (!contract.id || contract.id.length === 0) {
    throw new Error('Invalid contract address');
  }
  const dbContracts = toDBRecords(Table.metaFactories, [contract]);
  await knex(Table.metaFactories).insert(dbContracts)
}

export const removeMetaFactory = async(knex: Knex, contract: MetaFactory) => {
  throw 'not implemented'
}

export const addNftFactory = async(knex: Knex, contract: NftFactory) => {
  if (!contract.id || contract.id.length === 0) {
    throw new Error('Invalid contract address');
  }
  const dbContracts = toDBRecords(Table.nftFactories, [contract]);
  await knex(Table.nftFactories).insert(dbContracts)
}

export const clearERC721ContractTracks = async(knex: Knex, contractAddress: string) => {
  await knex(Table.nfts_processedTracks)
    .whereILike('nftId', `%${contractAddress}%`)
    .del()

  await knex(Table.processedTracks)
    .whereILike('id', `%${contractAddress}%`)
    .del()
}

export const clearERC721Contract = async(knex: Knex, contractAddress: string) => {
  if (!contractAddress || contractAddress.length === 0) {
    throw new Error('Invalid contract address');
  }
  const result = await knex.raw(`select cursor from "${Table.processors}" where id='createERC721NFTsFromTransfers';`);
  const parsedCursor = JSON.parse(result.rows[0].cursor);
  delete parsedCursor[contractAddress.toLowerCase()];
  const updatedCursor = JSON.stringify(parsedCursor);
  await knex.raw(`update "${Table.processors}" set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);

  await clearERC721ContractTracks(knex, contractAddress);

  await knex(Table.nftProcessErrors)
    .whereILike('nftId', `%${contractAddress}%`)
    .del()
  await knex.raw(`delete from "${Table.erc721Transfers}" where "contractAddress" ilike '${contractAddress}';`);
  await knex.raw(`delete from "${Table.nfts}" where "contractAddress" ilike '${contractAddress}'`);
}


export const removeNftFactory = async(knex: Knex, contract: NftFactory) => {
  throw 'not implemented'
}


async function getPrimaryKeys(knex: Knex): Promise<{
  table_name: string,
  column_name: string,
  foreign_table_name: string,
  foreign_column_name: string
}[]> {
  const result = await knex.raw(
    `
    SELECT
        tc.table_name,
        kcu.column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY';
    `
  )

  return result.rows
}

async function getForeignKeys(knex: Knex): Promise<{
  table_name: string,
  column_name: string,
  foreign_table_name: string,
  foreign_column_name: string
}[]> {
  const result = await knex.raw(
    `
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY';
    `
  )

  return result.rows
}

function tableNameToViewName(tableName: string): string {
  // remove raw_ prefix
  return tableName.substring(4)
}

export async function updateViews(knex: Knex){
  const tables = Object.values(Table);
  const foreignKeys = await getForeignKeys(knex);
  const primaryKeys = await getPrimaryKeys(knex);

  // create views
  for (const table of tables) {

    // return early if table doesn't exist
    const tableExistSql = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${table}')`;
    const exists = await knex.raw(tableExistSql);
    if (!exists.rows[0].exists) {
      console.log(`table ${table} does not exist yet, skipping view creation`);
      return
    }

    const viewName = tableNameToViewName(table);
    const override = overrides[table as Table];

    let selectSql = `select * from "${table}"`;

    if (override){
      selectSql = override;
    }

    const viewSql = `create or replace view "${viewName}" as ${selectSql}`;

    console.log('create view with sql', viewSql)

    await knex.raw(viewSql);
  }

  // create references and primaries
  for (const table of tables) {
    const viewName = tableNameToViewName(table);

    const foreigns = foreignKeys.filter(fk => fk.table_name === table)
    const foreignComments = foreigns.map(foreign => {
      return `@foreignKey ("${foreign.column_name}") references "${tableNameToViewName(foreign.foreign_table_name!)}" ("${foreign.foreign_column_name}")`
    })

    const primaries = primaryKeys.filter(fk => fk.table_name === table).map(primary => `"${primary.column_name}"`);
    const primaryComment = `@primaryKey ${primaries.join(',')}`;

    const comments = foreignComments.concat(primaryComment);

    const commentString = `comment on view "${viewName}" is E'${comments.join('\\n')}'`;

    await knex.raw(commentString)
  }

  // add permissions
  for (const table of tables){
    const viewName = tableNameToViewName(table);
    await knex.raw(`GRANT SELECT ON "${viewName}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  }
}
