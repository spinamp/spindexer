import _ from 'lodash';

import { Table } from '../db/db';
import { Clients } from '../types/processor';
import { ProcessedTrack } from '../types/track';
import { Artworks } from '../types/track';
import { Trigger } from '../types/trigger';

export const unpinnedTrackContent: (cidField: string, limit?: number) => Trigger<undefined> =
  (cidField: string, limit: number = parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)) => async (clients: Clients) => {
    const query = `select t.* from "${Table.processedTracks}" as t
      LEFT OUTER JOIN "${Table.ipfsPins}" as p
      ON t."${cidField}" = p.id
      WHERE (t."${cidField}" IS NOT NULL)
      AND (p.id is NULL)
      LIMIT ${limit}`

    const tracks = (await clients.db.rawSQL(
      query
    )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));

    const cids = tracks.map((track: ProcessedTrack) => {
      if (!(track as any)[cidField]) {
        throw new Error('Unexpected null ipfs cid')
      }
      return (track as any)[cidField];
    });

    return _.uniq(cids);
  };

export const unpinnedProcessedArtworks = function (limit?: number): Trigger<undefined> {
  return async function (clients: Clients) {
    const query = `select t.* from "${Table.processedArtworks}" as t
      LEFT OUTER JOIN "${Table.ipfsPins}" as p
      ON t.cid = p.id
      WHERE (t.cid IS NOT NULL)
      AND (p.id is NULL)
      LIMIT ${limit}`
    const artworks = (await clients.db.rawSQL(
      query
    )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
    const cids = artworks.map((artwork: Artworks) => {
      if (!artwork.cid) {
        throw new Error('Unexpected null ipfs cid')
      }
      return artwork.cid;
    });
    return cids;
  };
}
