import 'dotenv/config';
import { Knex } from 'knex';

import { Table } from '../db';

export const up = async (knex: Knex) => {
  // Artwork
  const artworkTracksWithCIDsMatchingURL = await knex.raw(`
  select distinct "lossyArtworkIPFSHash", "lossyArtworkURL" from "${Table.processedTracks}" as t
  left outer join "${Table.ipfsFiles}" as i
  on t."lossyArtworkIPFSHash" = i.cid
  where
    t."lossyArtworkIPFSHash" is not null and
    i.cid is null and
    i.error is null and
    t."lossyArtworkURL" ILIKE ('%' || t."lossyArtworkIPFSHash" || '%')
  `)

  const artworkFiles = artworkTracksWithCIDsMatchingURL.rows.map((row: any) => ({
    url: row.lossyArtworkURL,
    cid: row.lossyArtworkIPFSHash,
  }))

  console.log(`Migrating ${artworkFiles.length} ProcessedTracks without artwork files...`);
  if (artworkFiles.length > 0) {
    await knex(Table.ipfsFiles).insert(artworkFiles)
  }

  // Audio
  const audioTracksWithCIDsMatchingURL = await knex.raw(`
  select distinct "lossyAudioIPFSHash", "lossyAudioURL" from "${Table.processedTracks}" as t
  left outer join "${Table.ipfsFiles}" as i
  on t."lossyAudioIPFSHash" = i.cid
  where
    t."lossyAudioIPFSHash" is not null and
    i.cid is null and
    i.error is null and
    t."lossyAudioURL" ILIKE ('%' || t."lossyAudioIPFSHash" || '%')
  `)

  const audioFiles = audioTracksWithCIDsMatchingURL.rows.map((row: any) => ({
    url: row.lossyAudioURL,
    cid: row.lossyAudioIPFSHash,
  }))

  console.log(`Migrating ${audioFiles.length} ProcessedTracks without audio files...`);
  if (audioFiles.length > 0) {
    await knex(Table.ipfsFiles).insert(audioFiles)
  }
}

export const down = async (knex: Knex) => {
  console.log('Warning: no action taken on down migration');
}
