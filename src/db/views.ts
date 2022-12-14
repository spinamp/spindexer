import { Table } from './db';

// specify override sql for creating complex views for particular tables
export const overrides: {
  [table in Table]?: string;
} = {
  [Table.processedTracks]: `
    select t.*, audio_file."mimeType" as "lossyAudioMimeType", artwork_file."mimeType" as "lossyArtworkMimeType"
    from "${Table.processedTracks}" t

    join "${Table.ipfsPins}" audio_pin
    on t."lossyAudioIPFSHash" = audio_pin.id
    join "${Table.ipfsPins}" artwork_pin
    on t."lossyArtworkIPFSHash" = artwork_pin.id

    join "${Table.ipfsFiles}" audio_file
    on t."lossyAudioIPFSHash" = audio_file.cid
    join "${Table.ipfsFiles}" artwork_file
    on t."lossyArtworkIPFSHash" = artwork_file.cid

    where t."lossyArtworkIPFSHash" is not null
    and t."lossyAudioIPFSHash" is not null
    and (audio_file."mimeType" is not null and (audio_file."isAudio" = true or audio_file."isVideo" = true))
    and (artwork_file."mimeType" is not null and (artwork_file."isImage" = true or artwork_file."isVideo" = true))
    `
}

export const tablesExcludedFromViews = [
  Table.nftProcessErrors,
  Table.processors,
  Table.chains,
  'knex_migrations',
  'knex_migrations_lock'
]
