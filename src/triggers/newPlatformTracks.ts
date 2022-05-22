import { Clients, TrackAPIClientWithPremints } from '../types/processor';
import { Cursor, Trigger } from '../types/trigger';

export const newPlatformTracks: (platformId: string) => Trigger<Cursor> =
  (platformId: string) => async (clients, cursor) => {
    const platformClient: TrackAPIClientWithPremints = (clients as any)[platformId];
    if (!platformClient) {
      throw new Error('API Platform client not found');
    }
    const latestTrackCursor = await platformClient.fetchLatestTrackCursor();
    const lastProcessedCursor = latestTrackCursor;

    if (lastProcessedCursor === cursor) {
      return [];
    }

    const newTracks = await platformClient.getTracksFrom(cursor as any);
    return newTracks;
  };
