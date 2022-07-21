import { Knex } from 'knex';

import { Table } from '../db';

const MUSIC_PLATFORM_TYPES = ['noizd', 'catalog', 'sound', 'zora'];

const INITIAL_TABLES = [
  {
    name: Table.platforms, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.enu('type', MUSIC_PLATFORM_TYPES);
    }
  },
  {
    name: Table.nfts, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('tokenId');
      table.string('contractAddress');
      table.string('platformId');
      table.foreign('platformId').references('id').inTable('platforms');
      table.string('metadataIPFSHash');
      table.string('tokenURI', 20000);
      table.string('tokenMetadataURI', 20000);
      table.json('metadata');
      table.string('metadataError', 3000);
      table.string('mimeType');
      table.string('owner');
    }
  },
  {
    name: Table.artists, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('name');
      table.string('slug');
    }
  },
  {
    name: Table.artistProfiles, create: (table: Knex.CreateTableBuilder) => {
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('platformInternalId');
      table.string('name');
      table.string('avatarUrl', 3000);
      table.string('websiteUrl', 3000);
      table.string('artistId');
      table.foreign('artistId').references('id').inTable('artists');
      table.string('platformId');
      table.foreign('platformId').references('id').inTable('platforms');
      table.primary(['artistId', 'platformId']);
    }
  },
  {
    name: Table.processedTracks, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('title');
      table.string('slug');
      table.string('platformInternalId');
      table.string('lossyAudioIPFSHash');
      table.string('lossyAudioURL', 3000);
      table.string('description', 10000);
      table.string('lossyArtworkIPFSHash');
      table.string('lossyArtworkURL', 3000);
      table.string('websiteUrl', 3000);
      table.string('platformId');
      table.foreign('platformId').references('id').inTable('platforms');
      table.string('artistId');
      table.foreign('artistId').references('id').inTable('artists');
    }
  },
  {
    name: Table.processors, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.string('cursor', 5000000);
    }
  },
];

const INITIAL_PLATFORM_ENUMS = [
  { id: 'noizd', type: 'noizd' },
  { id: 'catalog', type: 'catalog' },
  { id: 'sound', type: 'sound' },
  { id: 'zora', type: 'zora' },
]

export const up = async (knex: Knex) => {
  console.log('Running initial DB bootstrap');
  const promises = INITIAL_TABLES.map(table => {
    return knex.schema.createTable(table.name, table.create);
  });
  await Promise.all(promises);
  await knex.raw(`GRANT SELECT ON "platforms" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "erc721nfts" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "artists" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "artistProfiles" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "processedTracks" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`comment on table processors is '@omit';`);
  await knex.raw(`comment on table knex_migrations is '@omit';`);
  await knex.raw(`comment on table knex_migrations_lock is '@omit';`);
  await knex('platforms').insert(INITIAL_PLATFORM_ENUMS);
};

exports.down = async (knex: Knex) => {
  const promises = INITIAL_TABLES.map(table => {
    return knex.schema.dropTable(table.name);
  });
  await Promise.all(promises);
}
