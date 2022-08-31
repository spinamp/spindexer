
import { Knex } from 'knex';

import { Table } from '../db';
import { updateViews } from '../migration-helpers';

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
  ipfsFiles = 'ipfsFiles',
}



export const up = async (knex: Knex) => {

  // rename tables with raw_ prefix
  for (const key of Object.keys(oldTables)){
    const oldName = oldTables[key as oldTables];
    // check if old table exists
    const hasOldTable = await knex.schema.hasTable(oldName);
    if (!hasOldTable){
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const newName = Table[key as Table];
    await knex.schema.renameTable(oldName, newName);
  }

  // remove 'status' column of ipfs_pins
  await knex.schema.alterTable(Table.ipfsPins, table => {
    table.dropColumn('status')
  })

  await updateViews(knex);

  await knex.raw(`drop view "erc721nft"`);
  await knex.raw(`drop view "erc721nfts_processedTracks"`);
}

export const down = async (knex: Knex) => {
  // for (const table of Object.values(Table)){
  //   await knex.raw(`drop view "${tableNameToViewName(table)}"`);
  // }

  await knex.schema.alterTable(Table.ipfsPins, table => {
    table.string('status')
  })

  // rename tables without raw_ prefix
  for (const key of Object.keys(oldTables)){
    const newName = oldTables[key as oldTables];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const oldName = Table[key as Table];

    await knex.schema.renameTable(oldName, newName);
  }
}
