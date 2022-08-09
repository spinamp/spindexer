import _ from 'lodash';

import { Table } from '../db/db';
import { Clients } from '../types/processor';
import { ProcessedTrack } from '../types/track';
import { Trigger } from '../types/trigger';

export const unpinnedTrackContent: (cidField: string, limit?: number) => Trigger<undefined> =
  (cidField: string, limit: number = parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)) => async (clients: Clients) => {
    const query = `select t.* from "${Table.processedTracks}" as t
      LEFT OUTER JOIN "${Table.ipfsPins}" as p
      ON t."${cidField}" = p.id
      WHERE (t."${cidField}" IS NOT NULL)
      AND (t."${cidField}" <> '')
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

export const audioNotOnIpfs: Trigger<undefined> = async (clients: Clients) => {
  const query = `select t.* from "${Table.processedTracks}" as t
      where "lossyAudioIPFSHash" is null
      and "lossyAudioURL" is not null
      LIMIT ${process.env.QUERY_TRIGGER_BATCH_SIZE!}`

  const tracks = (await clients.db.rawSQL(
    query
  )).rows

  return tracks
};

export const artworkNotOnIpfs: Trigger<undefined> = async (clients: Clients) => {
  const query = `select t.* from "${Table.processedTracks}" as t
      where "lossyArtworkIPFSHash" is null
      and "lossyArtworkURL" is not null
      LIMIT ${process.env.QUERY_TRIGGER_BATCH_SIZE!}`

  const tracks = (await clients.db.rawSQL(
    query
  )).rows

  return tracks
};