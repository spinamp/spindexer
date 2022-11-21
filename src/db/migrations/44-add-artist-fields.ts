import { Knex } from 'knex';
import _ from 'lodash';

import { controlledEthereumAddressFromId } from '../../utils/identifiers';
import { Table } from '../db';
import { tableNameToViewName, updateViews } from '../migration-helpers';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.artists, table => {
    table.string('address');
    table.string('avatarUrl');
    table.jsonb('externalLinks');
    table.jsonb('theme');
    table.jsonb('spinampLayoutConfig');
  })
  await updateViews(knex);

  const artistUpdates = await knex.raw(`
    select a.id, a.address, p."avatarUrl", p."createdAtBlockNumber" from raw_artists as a
      inner join raw_artist_profiles as p
      on a."id" = p."artistId"
      where a."address" is null
      and p."avatarUrl" is not null
      order by p."createdAtBlockNumber" desc
  `);

  if (artistUpdates.rows.length > 0) {
    const [withBlock, withoutBlock] = _.partition(artistUpdates.rows, row => !!row.createdAtBlockNumber);

    const earliestDistinctUpdate = Object.values(
      _.mapValues(
        _.groupBy(withBlock, 'id'),
        values => _.sortBy(values, 'createdAtBlockNumber')[0]
      )
    );

    const updates = earliestDistinctUpdate.concat(withoutBlock).map((row: any) => {
      return {
        id: row.id,
        address: controlledEthereumAddressFromId(row.id),
        avatarUrl: row.avatarUrl,
      }
    })

    await knex(Table.artists).insert(updates).onConflict('id').merge();
  }
}

export const down = async (knex: Knex) => {
  await knex.schema.dropViewIfExists(tableNameToViewName(Table.artists));
  await knex.schema.alterTable(Table.artists, table => {
    table.dropColumn('address');
    table.dropColumn('avatarUrl');
    table.dropColumn('externalLinks');
    table.dropColumn('theme');
    table.dropColumn('spinampLayoutConfig');
  });

  await updateViews(knex);
}
