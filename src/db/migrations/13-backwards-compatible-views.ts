
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {

  // backwards compatible view for nfts table
  await knex.raw(
    `create view erc721nft as
    select * from "${Table.nfts}"
    `
  )

  // backwards compatible view for nfts_processedTracks table
  await knex.raw(
    `create view "erc721nfts_processedTracks" as
    select npt."nftId" as "erc721NftId", npt."processedTrackId"
    from "${Table.nfts_processedTracks}" npt
    `
  )

  // add comment to add fake fk constraints to view for postgraphile relation generation
  await knex.raw(
    `comment on view "erc721nfts_processedTracks" is
    E'@foreignKey ("processedTrackId") references"${Table.processedTracks}" (id)\n@foreignKey ("erc721NftId") references erc721nft (id)';
    `
  )

  await knex.raw(`GRANT SELECT ON "erc721nfts_processedTracks" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
  await knex.raw(`GRANT SELECT ON "erc721nft" TO ${process.env.POSTGRES_USERNAME_OPEN}`);

}

export const down = async (knex: Knex) => {
  await knex.raw(`drop view erc721nft`);
  await knex.raw(`drop view "erc721nfts_processedTracks"`);
}
