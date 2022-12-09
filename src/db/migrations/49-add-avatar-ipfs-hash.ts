import {Knex} from 'knex';

import {Table} from '../db';
import { updateViews } from '../migration-helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(Table.artistProfiles, table => {
    table.string('avatarIPFSHash');
  });

  await updateViews(knex)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(Table.artistProfiles, table => {
    table.dropColumn('avatarIPFSHash');
  });

  await updateViews(knex)
}
