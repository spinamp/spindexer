import { Knex } from 'knex';
import _ from 'lodash';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

// 1. moves `url` <-> `cid` relationship to a new join table to support multiple urls per cid
// 2. changes ipfsFiles table's primary key to `cid`
export const up = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.ipfsFiles));
  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.dropPrimary();
  })

  const files = await knex.raw(`select * from "${Table.ipfsFiles}" where "cid" is not null`);
  const filesByCid = _.groupBy(files.rows, 'cid')
  const urlCids: any[] = [];

  const ipfsFileUpdates = Object.keys(filesByCid).map((key) => {
    const row = filesByCid[key];

    // prepare data for ipfsFilesUrls join table
    row.forEach((r: any) => {
      urlCids.push({ cid: r.cid, url: r.url })
    });

    // remove url from ipfsFiles table
    const { url, ...rest } = row[0];
    return rest;
  });

  // repopulate ipfsFiles table
  await knex(Table.ipfsFiles).truncate();
  await knex.schema.alterTable(Table.ipfsFiles, table => { table.dropColumn('url'); })
  await knex.batchInsert(Table.ipfsFiles, ipfsFileUpdates);

  // create and populate new join table
  await knex.schema.createTable(Table.ipfsFilesUrls, table => {
    table.string('url').notNullable();
    table.string('cid');
    table.string('error');
    table.integer('numberOfRetries').defaultTo(0);
    table.dateTime('lastRetry');
  })
  await knex.batchInsert(Table.ipfsFilesUrls, urlCids);

  // specify new primary keys for both tables
  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.primary(['cid']);
  })
  await knex.schema.alterTable(Table.ipfsFilesUrls, table => {
    table.primary(['url']);
  })

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  throw new Error('nope');
}
