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
      table.timestamp('createdAtTimestamp', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('tokenId');
      table.string('contractAddress');
      table.string('platform');
      table.foreign('platform').references('id').inTable('platforms');
      table.string('trackId');
      table.foreign('trackId').references('id').inTable('tracks');
    }
  },
  {
    name: 'artists', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.timestamp('createdAtTimestamp', { precision: 3 });
      table.string('name');
      table.string('slug');
    }
  },
  {
    name: 'artistProfiles', create: (table: Knex.CreateTableBuilder) => {
      table.timestamp('createdAtTimestamp', { precision: 3 });
      table.string('platformId');
      table.string('artistId');
      table.string('name');
      table.string('platform');
      table.foreign('platform').references('id').inTable('platforms');
      table.string('avatarUrl');
      table.string('websiteUrl');
      table.primary(['artistId', 'platform']);
      table.foreign('artistId').references('id').inTable('artists');
    }
  },
  {
    name: 'tracks', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.timestamp('createdAtTimestamp', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('platform');
      table.foreign('platform').references('id').inTable('platforms');
      table.string('metadataIPFSHash');
      table.string('tokenURI');
      table.string('tokenMetadataURI');
      table.json('metadata');
      table.string('metadataError');
      table.string('mimeType');
      table.boolean('processed');
      table.boolean('processError');
    },
  },
  {
    name: 'processedTracks', create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.timestamp('createdAtTimestamp', { precision: 3 });
      table.string('platformId');
      table.string('title');
      table.string('slug');
      table.string('platform');
      table.foreign('platform').references('id').inTable('platforms');
      table.string('lossyAudioIPFSHash');
      table.string('lossyAudioURL');
      table.string('description');
      table.string('artwork');
      table.string('lossyArtworkIPFSHash');
      table.string('lossyArtworkURL');
      table.string('websiteUrl');
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
