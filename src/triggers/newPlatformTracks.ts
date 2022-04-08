import { APIMusicPlatform } from '../processors/default/createProcessedTracksFromAPI';
import { Clients } from '../types/processor';
import { Cursor, Trigger } from '../types/trigger';

export const newPlatformTracks: (platform: APIMusicPlatform) => Trigger<Clients, Cursor> =
  (platform: APIMusicPlatform) => async (clients: Clients, cursor: Cursor) => {
    const latestTrackCursor = await clients[platform].fetchLatestTrackCursor();
    const lastProcessedCursor = latestTrackCursor;

    if (lastProcessedCursor === cursor) {
      return [];
    }

    const newTracks = await clients[platform].getTracksFrom(cursor as any);
    return newTracks;
  };
