import _ from 'lodash';
import { PartialRecord } from '../../db/db';
import { unprocessedPlatformTracks } from '../../triggers/missing';
import { Artist, ArtistProfile, mapArtist, mergeInExistingArtist } from '../../types/artist';
import { MusicPlatform, platformConfig, PlatformMapper } from '../../types/platform';
import { Clients } from '../../types/processor';
import { Track, ProcessedTrack, mergeProcessedTracks } from '../../types/track';

type ImplementedMusicPlatform = MusicPlatform.catalog | MusicPlatform.sound | MusicPlatform.noizd;

const name = 'processTracks';

const processPlatformTrackData = (platformTrackData: {
  track: Track;
  platformTrackResponse: unknown;
}[], platformMapper: PlatformMapper, platform: ImplementedMusicPlatform) => {
  const { mapArtistProfile, mapTrack } = platformMapper;

  const { processedTracks, trackUpdates } = platformTrackData.reduce<
    { processedTracks: ProcessedTrack[], trackUpdates: PartialRecord<Track>[] }>
    ((accum, item) => {
      if (item.platformTrackResponse) {
        const processedTrack = mapTrack(item)
        accum.processedTracks.push(processedTrack);
        accum.trackUpdates.push({
          id: item.track.id,
          processed: true,
        });
      } else {
        accum.trackUpdates.push({
          id: item.track.id,
          processed: true,
          processError: true,
        });
      }
      return accum;
    },
      { processedTracks: [], trackUpdates: [] }
    );
  const artistProfiles = _.uniqBy(platformTrackData.reduce<ArtistProfile[]>((profiles, trackData) => {
    if (trackData.platformTrackResponse) {
      const artistProfile = {
        ...mapArtistProfile(trackData.platformTrackResponse, trackData.track.createdAtBlockNumber),
      } as ArtistProfile;
      profiles.push(artistProfile);
    }
    return profiles
  }, []), 'artistId');
  const artists = artistProfiles.map(profile => mapArtist(profile, platform));
  return {
    processedTracks, trackUpdates, artists,
  };
}

const processorFunction = (platform: Partial<ImplementedMusicPlatform>) => async (tracks: Track[], clients: Clients) => {
  console.log(`Getting ${platform} API tracks for ids: ${tracks.map(t => t.id)}`);
  const platformMapper = platformConfig[platform].mappers;
  if (!platformMapper) {
    throw new Error(`Platform mapper for ${platform} not found`);
  }
  const platformTrackData = await platformMapper.addPlatformTrackData(tracks, clients[platform]);

  const { processedTracks, trackUpdates, artists } = processPlatformTrackData(platformTrackData, platformMapper, platform);
  const mergedProcessedTracks = await mergeProcessedTracks(processedTracks, clients.db, true);

  const mergedArtists = await mergeInExistingArtist(artists, clients.db);
  await clients.db.update('tracks', trackUpdates);
  await clients.db.upsert('processedTracks', mergedProcessedTracks);
  await clients.db.upsert('artists', mergedArtists);
};

export const processPlatformTracks = (platform: ImplementedMusicPlatform) => ({
  name,
  trigger: unprocessedPlatformTracks(platform),
  processorFunction: processorFunction(platform),
  initialCursor: undefined,
});
