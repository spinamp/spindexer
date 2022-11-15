import _ from 'lodash';

import { Table } from '../../db/db';
import { newPlatformTracks } from '../../triggers/newPlatformTracks';
import { mapArtist } from '../../types/artist';
import { MusicPlatformTypeConfig, platformConfigs } from '../../types/platform';
import { Clients, Processor, TrackAPIClientWithPremints } from '../../types/processor';
import { Record } from '../../types/record';
import { mergeProcessedTracks } from '../../types/track';

const NAME = 'createProcessedTracksFromAPI';

const processorFunction = (platformId: string, name: string) => async (apiTracks: unknown[], clients: Clients) => {
  console.info(`Processing ${apiTracks.length} api tracks from ${platformId}`);
  const platformConfig: MusicPlatformTypeConfig = (platformConfigs as any)[platformId];
  if (!platformConfig) {
    throw new Error('API Platform config not found');
  }
  const platformClient: TrackAPIClientWithPremints = (clients as any)[platformId];
  if (!platformClient) {
    throw new Error('API Platform client not found');
  }
  const { mapArtistProfile } = platformConfig.mappers;
  const lastCursor = platformClient.getAPITrackCursor(apiTracks[apiTracks.length - 1]);

  const artistProfiles = _.uniqBy(apiTracks.map(apiTrack => {
    return mapArtistProfile({ apiTrack });
  }), 'artistId');

  const artists = artistProfiles.map(profile => mapArtist(profile));

  // Because we assume an artist has the same ID across all profiles, we
  // don't need to worry about changing the artistId and artist{} fields in the processed
  // tracks and can just do a simple merge.
  const processedTracks = apiTracks.map(apiTrack => platformClient.mapAPITrack(apiTrack));
  const { mergedProcessedTracks } = await mergeProcessedTracks(processedTracks, clients.db, false);

  await clients.db.insert(Table.artists, artists, { updateUndefinedOnConflict: 'id' });
  await clients.db.upsert(Table.artistProfiles, (artistProfiles as unknown as Record[]), ['artistId', 'platformId']);
  await clients.db.upsert(Table.processedTracks, mergedProcessedTracks);
  await clients.db.updateProcessor(name, lastCursor);
  console.info(`Processing completed, updated cursor to ${lastCursor}`);
};

// TODO: platformId here is being used both as platformId and MusicPlatformType. Need to bring in the full
// platform object here and avoid mixing them
export const createProcessedTracksFromAPI: (platformId: string) => Processor =
  (platformId: string) => {
    const platformConfig: MusicPlatformTypeConfig = (platformConfigs as any)[platformId];
    if (!platformConfig) {
      throw new Error('API Platform config not found');
    }
    return ({
      name: `${NAME}_${platformId}`,
      trigger: newPlatformTracks(platformId),
      processorFunction: processorFunction(platformId, `${NAME}_${platformId}`),
      initialCursor: platformConfig.initialTrackCursor,
    })
  };
