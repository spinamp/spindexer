import 'dotenv/config';
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  const tracksWithCIDsMatchingURL = await knex.raw(`
    select distinct "lossyArtworkIPFSHash", "lossyArtworkURL" from "${Table.processedTracks}" as t
    left outer join "${Table.ipfsFiles}" as i
    on t."lossyArtworkURL" = i.url
    where (
      (t."lossyArtworkIPFSHash" is not null and t."lossyArtworkURL" is not null)
      and
      (t."lossyArtworkURL" ILIKE ('%' || t."lossyArtworkIPFSHash" || '%'))
      and
      (i.url is null and i.error is null)
    )
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
