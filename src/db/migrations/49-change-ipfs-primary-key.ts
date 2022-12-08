import { Knex } from 'knex';
import _ from 'lodash';

import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.ipfsFiles));
  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.dropPrimary();
  })

  const files = await knex.raw(`select * from "${Table.ipfsFiles}" where "cid" is not null`);
  const filesByCid = _.groupBy(files.rows, 'cid')
  const updates = Object.keys(filesByCid).map( (key) => {
    const row = filesByCid[key];
    const urls = row.map( (r: any) => r.url)
    return { ...row[0], url: urls }
  });

  await knex(Table.ipfsFiles).truncate();
  await knex.schema.alterTable(Table.ipfsFiles, table => { table.dropColumn('url'); })
  await knex.schema.alterTable(Table.ipfsFiles, table => { table.specificType('url', 'text[]'); })

  await knex.batchInsert(Table.ipfsFiles, updates);

  await knex.schema.alterTable(Table.ipfsFiles, table => {
    table.primary(['cid']);
  })
  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  throw new Error('nope');
}
