import _ from 'lodash';

import { newPlatformTracks } from '../../triggers/newPlatformTracks';
import { mapArtist } from '../../types/artist';
import { MusicPlatform, platformConfig } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';
import { Record } from '../../types/record';
import { mergeProcessedTracks } from '../../types/track';

const NAME = 'createProcessedTracksFromAPI';
export type APIMusicPlatform = MusicPlatform.noizd;

const processorFunction = (platformId: APIMusicPlatform, name: string) => async (apiTracks: unknown[], clients: Clients) => {
  console.info(`Processing ${apiTracks.length} api tracks from ${platformId}`);
  const { mapAPITrack, mapArtistProfile, mapAPITrackTime } = platformConfig[platformId].mappers!;
  const lastCursor = clients[platformId].getAPITrackCursor(apiTracks[apiTracks.length - 1]);

  const artistProfiles = _.uniqBy(apiTracks.map(apiTrack => {
    return mapArtistProfile(apiTrack, mapAPITrackTime!(apiTrack));
  }), 'artistId');

  const artists = artistProfiles.map(profile => mapArtist(profile));

  // Because we assume an artist has the same ID across all profiles, we
  // don't need to worry about changing the artistId and artist{} fields in the processed
  // tracks and can just do a simple merge.
  const processedTracks = apiTracks.map(apiTrack => mapAPITrack!(apiTrack));
  const { mergedProcessedTracks } = await mergeProcessedTracks(processedTracks, clients.db, false);

  await clients.db.upsert('artists', artists);
  await clients.db.upsert('artistProfiles', (artistProfiles as unknown as Record[]), ['artistId', 'platformId']);
  await clients.db.upsert('processedTracks', mergedProcessedTracks);
  await clients.db.updateProcessor(name, lastCursor);
  console.info(`Processing completed, updated cursor to ${lastCursor}`);
};

export const createProcessedTracksFromAPI: (platformId: APIMusicPlatform) => Processor =
  (platformId: APIMusicPlatform) => ({
    name: `${NAME}_${platformId}`,
    trigger: newPlatformTracks(platformId),
    processorFunction: processorFunction(platformId, `${NAME}_${platformId}`),
    initialCursor: platformConfig[platformId].initialTrackCursor,
  });
