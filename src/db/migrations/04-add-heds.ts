import path from 'path';

import { Knex } from 'knex';

export const up = async (knex: Knex) => {
  const migrationName = path.basename(__filename);
  console.log(`deprecation warning: ${migrationName} replaced by CRDT in migration 38`);
};

exports.down = async (knex: Knex) => {
  return;
}
