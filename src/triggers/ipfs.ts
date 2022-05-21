import { Table } from '../db/db';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const processedTracksWithoutPins: (limit?: number) => Trigger<undefined> =
  (limit: number = parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)) => async (clients: Clients) => {
    const query = `select t.* from "${Table.processedTracks}" as t
      LEFT OUTER JOIN "${Table.processedTracks_ipfsPins}" as j
      ON t.id = j."processedTrackId"
      WHERE j."processedTrackId" is NULL
      LIMIT ${limit}`
      const tracks = (await clients.db.rawSQL(
        query
      )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
    return tracks;
  };
