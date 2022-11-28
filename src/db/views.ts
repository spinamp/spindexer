import { Table } from './db';

// specify override sql for creating complex views for particular tables
export const overrides: {
  [table in Table]?: string;
} = {
  [Table.processedTracks]: `
    select t.* from "${Table.processedTracks}" t

    join "${Table.ipfsPins}" p
    on t."lossyAudioIPFSHash" = p.id
    join "${Table.ipfsPins}" p1
    on t."lossyArtworkIPFSHash" = p1.id

    join "${Table.ipfsFiles}" f
    on t."lossyAudioIPFSHash" = f.cid
    join "${Table.ipfsFiles}" f1
    on t."lossyArtworkIPFSHash" = f1.cid

    where "lossyArtworkIPFSHash" is not null
    and "lossyAudioIPFSHash" is not null
    and f."mimeType" is not null
    and f1."mimeType" is not null
    `
}

export const tablesExcludedFromViews = [
  Table.nftProcessErrors,
  Table.processors,
  Table.chains,
  'knex_migrations',
  'knex_migrations_lock'
]
