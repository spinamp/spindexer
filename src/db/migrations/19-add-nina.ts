
import { Knex } from 'knex';

import { FactoryContract, FactoryContractTypeName, NFTStandard } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { Table } from '../db';
import { addFactoryContract, removeFactoryContract, removePlatform } from '../migration-helpers';

const NINA_PLATFORM = {
  id: 'nina',
  type: MusicPlatformType.nina,
  name: 'Nina',
}

const NINA: FactoryContract = {
  address: 'ninaN2tm9vUkxoanvGcNApEeWiidLMM2TdBX8HoJuL4',
  platformId: NINA_PLATFORM.id,
  contractType: FactoryContractTypeName.ninaMintCreator
};

export const up = async (knex: Knex) => {
  await knex.schema.renameTable('erc721Contracts', Table.nftFactories);
  await knex.schema.renameTable('erc721nfts_processedTracks', Table.nfts_processedTracks);
  await knex.schema.renameTable('erc721nftProcessErrors', Table.nftProcessErrors);
  await knex.schema.renameTable('erc721nfts', Table.nfts);

  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['nina'::text, 'noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text, 'mintsongs-v2'::text]))`);

  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" drop constraint "erc721nfts_processedtracks_erc721nftid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" add constraint "erc721nfts_processedtracks_erc721nftid_foreign" foreign key ("erc721nftId") references "${Table.nfts}" (id) on delete cascade`);      

  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" drop constraint "erc721nfts_processedtracks_processedtrackid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" add constraint "erc721nfts_processedtracks_processedtrackid_foreign" foreign key ("processedTrackId") references "${Table.processedTracks}" (id) on delete cascade`);      

  await knex.raw(`ALTER TABLE "${Table.processedTracks}" drop constraint "processedtracks_artistid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.processedTracks}" add constraint "processedtracks_artistid_foreign" foreign key ("artistId") references "${Table.artists}" (id) on delete cascade`);      

  await knex.raw(`ALTER TABLE "${Table.processedTracks}" drop constraint "processedtracks_platformid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.processedTracks}" add constraint "processedtracks_platformid_foreign" foreign key ("platformId") references "${Table.platforms}" (id) on delete cascade`);      

  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" drop constraint "artistprofiles_artistid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" add constraint "artistprofiles_artistid_foreign" foreign key ("artistId") references "${Table.artists}" (id) on delete cascade`);      

  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" drop constraint "artistprofiles_platformid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" add constraint "artistprofiles_platformid_foreign" foreign key ("platformId") references "${Table.platforms}" (id) on delete cascade`);      

  await knex.schema.alterTable(Table.processedTracks, table => {
    table.text('description').alter();
    table.text('title').alter();
    table.text('lossyArtworkURL').alter();
    table.text('lossyAudioURL').alter();
    table.text('websiteUrl').alter();
    table.string('slug', 1020).alter();
  })

  await knex.schema.alterTable(Table.nftFactories, table => {
    table.enu('standard', Object.values(NFTStandard)).defaultTo(NFTStandard.ERC721)
  })

  await knex.schema.alterTable(Table.nfts, table => {
    table.foreign('contractAddress').references('id').inTable(Table.nftFactories).onDelete('CASCADE')
  })

  await knex(Table.platforms).insert([NINA_PLATFORM]);
  await addFactoryContract(knex, NINA)
}

export const down = async (knex: Knex) => {
  await knex.raw(`delete from "${Table.artists}" where id like '${NINA_PLATFORM.id}/%'`)
  await removeFactoryContract(knex, NINA)
  await removePlatform(knex, NINA_PLATFORM, NINA)
  await knex.raw(`ALTER TABLE platforms drop constraint "platforms_type_check"`);
  await knex.raw(`ALTER TABLE "${Table.platforms}" add constraint "platforms_type_check" CHECK (type = ANY (ARRAY['noizd'::text, 'catalog'::text, 'sound'::text, 'zora'::text, 'single-track-multiprint-contract'::text, 'chaos'::text, 'mintsongs-v2'::text]))`);

  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" drop constraint "erc721nfts_processedtracks_erc721nftid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" add constraint "erc721nfts_processedtracks_erc721nftid_foreign" foreign key ("erc721nftId") references "${Table.nfts}" (id)`);      

  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" drop constraint "erc721nfts_processedtracks_processedtrackid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.nfts_processedTracks}" add constraint "erc721nfts_processedtracks_processedtrackid_foreign" foreign key ("processedTrackId") references "${Table.processedTracks}" (id)`);      

  await knex.raw(`ALTER TABLE "${Table.processedTracks}" drop constraint "processedtracks_artistid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.processedTracks}" add constraint "processedtracks_artistid_foreign" foreign key ("artistId") references "${Table.artists}" (id)`);      

  await knex.raw(`ALTER TABLE "${Table.processedTracks}" drop constraint "processedtracks_platformid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.processedTracks}" add constraint "processedtracks_platformid_foreign" foreign key ("platformId") references "${Table.platforms}" (id)`);      

  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" drop constraint "artistprofiles_artistid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" add constraint "artistprofiles_artistid_foreign" foreign key ("artistId") references "${Table.artists}" (id)`);      

  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" drop constraint "artistprofiles_platformid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.artistProfiles}" add constraint "artistprofiles_platformid_foreign" foreign key ("platformId") references "${Table.platforms}" (id)`);      

  await knex.schema.alterTable(Table.processedTracks, table => {
    table.string('description', 50000).alter();
    table.string('title', 255).alter();
    table.string('lossyArtworkURL', 3000).alter();
    table.string('lossyAudioURL', 3000).alter();
    table.string('websiteUrl',3000).alter();
    table.string('slug', 255).alter();
  })

  await knex.schema.alterTable(Table.nftFactories, table => {
    table.dropColumn('standard')
  })

  await knex.schema.alterTable(Table.nfts, table => {
    table.dropForeign('contractAddress')
  })

  await knex.schema.renameTable(Table.nftFactories,'erc721Contracts');
  await knex.schema.renameTable( Table.nfts_processedTracks,'erc721nfts_processedTracks');
  await knex.schema.renameTable(Table.nftProcessErrors,'erc721nftProcessErrors');
  await knex.schema.renameTable(Table.nfts,'erc721nfts');
}
