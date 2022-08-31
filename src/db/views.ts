import { Table } from './db';

// specify override sql to for creating a view
export const overrides: {
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