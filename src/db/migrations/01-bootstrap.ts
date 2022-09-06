import { Knex } from 'knex';

import { NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { Table } from '../db';

const INITIAL_TABLES = [
  {
    name: Table.platforms, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.enu('type', Object.values(MusicPlatformType)).notNullable()
      table.string('name', 1024).notNullable();
    }
  },
  {
    name: Table.nftFactories, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.string('platformId');
      table.foreign('platformId').references('id').inTable(Table.platforms).onDelete('cascade');
      table.string('startingBlock');
      table.string('contractType');
      table.jsonb('typeMetadata');
      table.enu('standard', Object.values(NFTStandard)).defaultTo(NFTStandard.ERC721);
      table.string('name', 1024);
      table.string('symbol', 256);
      table.boolean('autoApprove').defaultTo(false)
      table.boolean('approved').defaultTo(false);
    }
  },
  {
    name: Table.metaFactories, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.string('platformId');
      table.foreign('platformId').references('id').inTable(Table.platforms).onDelete('cascade');
      table.string('startingBlock');
      table.string('contractType');
      table.string('gap');
      table.enu('standard', Object.values(NFTStandard)).defaultTo(NFTStandard.ERC721);
      table.boolean('autoApprove').defaultTo(false)
    }
  },
  {
    name: Table.nfts, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('tokenId');
      table.string('contractAddress').references('id').inTable(Table.nftFactories).onDelete('cascade');
      table.string('platformId');
      table.foreign('platformId').references('id').inTable(Table.platforms).onDelete('cascade');
      table.string('metadataIPFSHash');
      table.string('tokenURI', 20000);
      table.string('tokenMetadataURI', 20000);
      table.jsonb('typeMetadata');
      table.jsonb('metadata');
      table.string('mimeType');
      table.string('owner');
      table.boolean('approved').defaultTo(false)
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
      table.foreign('artistId').references('id').inTable(Table.artists).onDelete('cascade');
      table.string('platformId');
      table.foreign('platformId').references('id').inTable(Table.platforms).onDelete('cascade');
      table.primary(['artistId', 'platformId']);
    }
  },
  {
    name: Table.processedTracks, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.text('title');
      table.string('slug', 1020);
      table.string('platformInternalId');
      table.string('lossyAudioIPFSHash');
      table.text('lossyAudioURL');
      table.text('description');
      table.string('lossyArtworkIPFSHash');
      table.text('lossyArtworkURL');
      table.text('websiteUrl');
      table.string('platformId');
      table.foreign('platformId').references('id').inTable(Table.platforms).onDelete('cascade');
      table.string('artistId');
      table.foreign('artistId').references('id').inTable(Table.artists).onDelete('cascade');
    }
  },
  {
    name: Table.processors, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.string('cursor', 5000000);
    }
  },
  {
    name: Table.nfts_processedTracks, create: (table: Knex.CreateTableBuilder) => {
      table.string('nftId').references('id').inTable(Table.nfts).onDelete('cascade');
      table.string('processedTrackId').references('id').inTable(Table.processedTracks).onDelete('cascade');
      table.primary(['nftId','processedTrackId']);
    }
  },
  {
    name: Table.nftProcessErrors, create: (table: Knex.CreateTableBuilder) => {
      table.string('nftId').references('id').inTable(Table.nfts).onDelete('cascade');
      table.primary(['nftId']);
      table.string('processError', 3000);
      table.string('metadataError', 3000),
      table.integer('numberOfRetries').defaultTo(0)
      table.dateTime('lastRetry')
    }
  },
  {
    name: Table.ipfsPins, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary(); //ipfs cid
      table.string('requestId');
      table.string('status');
    }
  },
  {
    name: Table.erc721Transfers, create: (table: Knex.CreateTableBuilder) => {
      table.string('id').primary();
      table.datetime('createdAtTime', { precision: 3 });
      table.bigint('createdAtEthereumBlockNumber');
      table.string('from');
      table.string('to');
      table.string('contractAddress');
      table.string('tokenId');
      table.string('nftId')
      table.string('transactionHash')
      table.foreign('nftId').references('id').inTable(Table.nfts).onDelete('cascade');
    }
  }
];

const INITIAL_PLATFORM_ENUMS: MusicPlatform[] = [
  { id: 'noizd', type: MusicPlatformType.noizd, name: 'NOIZD' },
  { id: 'catalog', type: MusicPlatformType.catalog, name: 'Catalog' },
  { id: 'sound', type: MusicPlatformType.sound, name: 'Sound.xyz' },
  { id: 'zoraOriginal', type: MusicPlatformType.zora, name: 'Zora' },
  { id: 'zora', type: MusicPlatformType.zora, name: 'Zora' },
]

export const up = async (knex: Knex) => {
  console.log('Running initial DB bootstrap');
  const promises = INITIAL_TABLES.map(table => {
    return knex.schema.createTable(table.name, table.create);
  });
  await Promise.all(promises);
  await knex.raw(`GRANT SELECT ON "${Table.metaFactories}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.nftFactories}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.platforms}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.nfts}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.artists}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.artistProfiles}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.processedTracks}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.nfts_processedTracks}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.ipfsPins}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "${Table.erc721Transfers}" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`comment on table "${Table.nftProcessErrors}" is '@omit';`);
  await knex.raw(`comment on table "${Table.processors}" is '@omit';`);
  await knex.raw(`comment on table knex_migrations is '@omit';`);
  await knex.raw(`comment on table knex_migrations_lock is '@omit';`);
  await knex(Table.platforms).insert(INITIAL_PLATFORM_ENUMS);
};

exports.down = async (knex: Knex) => {
  const promises = INITIAL_TABLES.map(table => {
    return knex.schema.dropTable(table.name);
  });
  await Promise.all(promises);
}
