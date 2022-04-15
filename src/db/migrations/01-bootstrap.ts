import { Knex } from 'knex';

const INITIAL_TABLES = [
  {
    name: 'platforms', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
    }
  },
  {
    name: 'nfts', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('tokenId');
      table.string('contractAddress');
      table.string('platformId');
      table.foreign('platformId').references('id').inTable('platforms');
      table.string('trackId');
      table.foreign('trackId').references('id').inTable('tracks');
    }
  },
  {
    name: 'artists', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('name');
      table.string('slug');
    }
  },
  {
    name: 'artistProfiles', create: (table: Knex.CreateTableBuilder) => {
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
    name: 'tracks', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('platformId');
      table.foreign('platformId').references('id').inTable('platforms');
      table.string('metadataIPFSHash');
      table.string('tokenURI', 20000);
      table.string('tokenMetadataURI', 20000);
      table.json('metadata');
      table.string('metadataError', 3000);
      table.string('mimeType');
      table.boolean('processed');
      table.boolean('processError');
    },
  },
  {
    name: 'processedTracks', create: (table: Knex.CreateTableBuilder) => {
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
    name: 'processors', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.string('cursor');
    }
  },
];

const INITIAL_PLATFORM_ENUMS = [
  { id: "sound" },
  { id: "zora" },
  { id: "noizd" },
  { id: "catalog" },
  { id: "zoraRaw" },
  { id: "other" }
]

export const up = async (knex: Knex) => {
  const promises = INITIAL_TABLES.map(table => {
    return knex.schema.createTable(table.name, table.create);
  });
  await Promise.all(promises);
  await knex('platforms').insert(INITIAL_PLATFORM_ENUMS);
};

exports.down = async (knex: Knex) => {
  const promises = INITIAL_TABLES.map(table => {
    return knex.schema.dropTable(table.name);
  });
  await Promise.all(promises);
}
