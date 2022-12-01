import 'dotenv/config';
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  const tracksWithCIDsMatchingURL = await knex.raw(`
  select distinct "lossyArtworkIPFSHash" from "${Table.processedTracks}" as t
  left outer join "${Table.ipfsFiles}" as i
  on t."lossyArtworkIPFSHash" = i.cid
  where
    t."lossyArtworkIPFSHash" is not null and
    i.cid is null and
    i.error is null and
    t."lossyArtworkURL" ILIKE ('%' || t."lossyArtworkIPFSHash" || '%')
  `)

  const ipfsFiles = tracksWithCIDsMatchingURL.rows.map((row: any) => ({
    url: row.lossyArtworkURL,
    cid: row.lossyArtworkIPFSHash,
  }))

  console.log(`Migrating ${ipfsFiles.length} ProcessedTracks without IPFSFiles...`);
  if (ipfsFiles.length > 0) {
    await knex(Table.ipfsFiles).insert(ipfsFiles)
  }
}

export const down = async (knex: Knex) => {
  console.log('Warning: no action taken on down migration');
}
