import { Table } from './db';

// specify override sql to for creating a view
export const overridesV1: {
  [table in Table]?: string;
} = {
  [Table.processedTracks]: `
    select t.*
    from "${Table.processedTracks}" t
    join "${Table.ipfsPins}" p
    on t."lossyAudioIPFSHash" = p.id
    join "${Table.ipfsPins}" p1
    on t."lossyArtworkIPFSHash" = p1.id
    where "lossyArtworkIPFSHash" is not null
    and "lossyAudioIPFSHash" is not null
    `
}

export const overridesV2: {
  [table in Table]?: string;
} = {
  [Table.processedTracks]: `
    select t.*
    from "${Table.processedTracks}" t
    join "${Table.ipfsPins}" p
    on t."lossyAudioIPFSHash" = p.id
    join "${Table.ipfsPins}" p1
    on t."lossyArtworkIPFSHash" = p1.id
    where "lossyArtworkIPFSHash" is not null
    and "lossyArtworkMimeType" is not null
    and "lossyAudioIPFSHash" is not null
    and "lossyAudioMimeType" is not null
    `
}

export const tablesExcludedFromViews = [
  Table.nftProcessErrors,
  Table.processors,
  Table.chains,
  'knex_migrations',
  'knex_migrations_lock'
]
