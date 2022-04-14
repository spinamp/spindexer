import _ from 'lodash';
import { newPlatformTracks } from '../../triggers/newPlatformTracks';
import { mapArtist } from '../../types/artist';
import { MusicPlatform, platformConfig } from '../../types/platform';
import { Record } from '../../types/record';
import { Clients, Processor } from '../../types/processor';
import { mergeProcessedTracks } from '../../types/track';

const NAME = 'createProcessedTracksFromAPI';
export type APIMusicPlatform = MusicPlatform.noizd;

const processorFunction = (platform: APIMusicPlatform, name: string) => async (apiTracks: unknown[], clients: Clients) => {
  console.info(`Processing ${apiTracks.length} api tracks from ${platform}`);
  const { mapAPITrack, mapArtistProfile, mapAPITrackTimestamp } = platformConfig[platform].mappers!;
  const lastCursor = clients[platform].getAPITrackCursor(apiTracks[apiTracks.length - 1]);

  const artistProfiles = _.uniqBy(apiTracks.map(apiTrack => {
    return mapArtistProfile(apiTrack, mapAPITrackTimestamp!(apiTrack));
  }), 'artistId');

  const artists = artistProfiles.map(profile => mapArtist(profile));

  // Because we assume an artist has the same ID across all profiles, we
  // don't need to worry about changing the artistId and artist{} fields in the processed
  // tracks and can just do a simple merge.
  const processedTracks = apiTracks.map(apiTrack => mapAPITrack!(apiTrack));
  const { mergedProcessedTracks } = await mergeProcessedTracks(processedTracks, clients.db, false);

  await clients.db.upsert('processedTracks', mergedProcessedTracks);
  await clients.db.upsert('artists', artists);
  await clients.db.upsert('artistProfiles', (artistProfiles as unknown as Record[]), ['artistId', 'platform']);
  await clients.db.updateProcessor(name, lastCursor);
  console.info(`Processing completed, updated cursor to ${lastCursor}`);
};

export const createProcessedTracksFromAPI: (platform: APIMusicPlatform) => Processor =
  (platform: APIMusicPlatform) => ({
    name: `${NAME}_${platform}`,
    trigger: newPlatformTracks(platform),
    processorFunction: processorFunction(platform, `${NAME}_${platform}`),
    initialCursor: platformConfig[platform].initialTrackCursor,
  });
