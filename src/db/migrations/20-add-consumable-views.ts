
import { Knex } from 'knex';

import { Table } from '../db';

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

enum oldTables {
  platforms = 'platforms',
  nfts = 'nfts',
  erc721Transfers = 'erc721Transfers',
  artists = 'artists',
  artistProfiles = 'artistProfiles',
  processedTracks = 'processedTracks',
  processors = 'processors',
  metaFactories = 'metaFactories',
  nftFactories = 'nftFactories',
  nfts_processedTracks = 'nfts_processedTracks',
  nftProcessErrors = 'nftProcessErrors',
  ipfsPins = 'ipfsPins',
}

function tableNameToViewName(tableName: string): string {
  return `consumable${tableName[0].toUpperCase() + tableName.substring(1)}`
}

export const up = async (knex: Knex) => {

  // rename tables with rawPrefix
  for (const key of Object.keys(oldTables)){
    const oldName = oldTables[key as oldTables];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const newName = Table[key as Table];
    await knex.schema.renameTable(oldName, newName);
  }

  // specify conditions to add to each view
  const conditions: {
    [table in Table]?: string
  } = {
    [Table.processedTracks]: `
    "lossyArtworkIPFSHash" is not null 
    and "lossyAudioIPFSHash" is not null`,
  }

  const tables = Object.values(Table);
  const foreignKeys = await getForeignKeys(knex)

  // create views
  for (const table of tables) {
    const viewName = tableNameToViewName(table);
    const condition = conditions[table as Table];

    let viewSql = `create view "${viewName}" as 
      select * from "${table}"
    `

    if (condition) {
      const where = `where ${condition}`;
      viewSql = viewSql.concat(where);
    }

    await knex.raw(viewSql);
  }

  // create references
  for (const table of tables) {
    const viewName = tableNameToViewName(table);
    const references = foreignKeys.filter(fk => fk.table_name === table)

    const comments = references.map(ref => {
      return `@foreignKey ("${ref.column_name}") references "${tableNameToViewName(ref.foreign_table_name!)}" ("${ref.foreign_column_name}")`
    })

    const commentString = `comment on view "${viewName}" is E'${comments.join('\\n')}'`;

    await knex.raw(commentString)
  }
  
  // add permissions
  for (const table of tables){
    const viewName = tableNameToViewName(table);
    await knex.raw(`GRANT SELECT ON "${viewName}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  }
}

export const down = async (knex: Knex) => {
  for (const table of Object.values(Table)){
    await knex.raw(`drop view "${tableNameToViewName(table)}"`);
  }

  // rename tables without rawPrefix
  for (const key of Object.keys(oldTables)){
    const newName = oldTables[key as oldTables];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const oldName = Table[key as Table];
  
    await knex.schema.renameTable(oldName, newName);
  }
}