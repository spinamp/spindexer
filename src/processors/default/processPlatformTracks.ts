import _ from 'lodash';
import { PartialRecord } from '../../db/db';
import { unprocessedPlatformTracks } from '../../triggers/missing';
import { Artist, ArtistProfile, mapArtist } from '../../types/artist';
import { MusicPlatform, platformConfig, PlatformMapper } from '../../types/platform';
import { Clients } from '../../types/processor';
import { Track, ProcessedTrack } from '../../types/track';

type ImplementedMusicPlatform = MusicPlatform.catalog | MusicPlatform.sound | MusicPlatform.noizd;

const name = 'processTracks';

const processPlatformTrackData = (platformTrackData: {
  track: Track;
  platformTrackResponse: unknown;
}[], platformMapper: PlatformMapper, platform: ImplementedMusicPlatform) => {
  const { mapArtistProfile, mapTrack } = platformMapper;

  const { processedTracks, trackUpdates } = platformTrackData.reduce<
    { processedTracks: Omit<ProcessedTrack, 'artistId' | 'artist'>[], trackUpdates: PartialRecord<Track>[] }>
    ((accum, item) => {
      accum.trackUpdates.push({
        id: item.track.id,
        processed: true,
      });
      if (item.platformTrackResponse) {
        const processedTrack = mapTrack(item)
        accum.processedTracks.push(processedTrack);
      }
      return accum;
    },
      { processedTracks: [], trackUpdates: [] }
    );
  const artistProfiles = _.uniqBy(platformTrackData.reduce<ArtistProfile[]>((profiles, trackData) => {
    if (trackData.platformTrackResponse) {
      profiles.push(mapArtistProfile(trackData.platformTrackResponse, trackData.track.createdAtBlockNumber));
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
  const existingArtistsQuery = { where: artists.map(a => ({ key: 'id', value: a.id })), whereType: 'or' };
  const existingArtists = await clients.db.getRecords<Artist>('artists', existingArtistsQuery);
  const existingArtistsById = _.keyBy(existingArtists, 'id');
  const mergedArtists = artists.map(artist => {
    const existingArtist = existingArtistsById[artist.id];
    if (existingArtist) {
      const mergedProfiles = Object.assign({}, artist.profiles, existingArtist.profiles);
      return Object.assign({}, artist, existingArtist, {
        profiles: mergedProfiles
      });
    }
    return artist;
  });
  await clients.db.update('tracks', trackUpdates);
  await clients.db.insert('processedTracks', processedTracks);
  await clients.db.upsert('artists', mergedArtists);
};

export const processPlatformTracks = (platform: Partial<ImplementedMusicPlatform>) => ({
  name,
  trigger: unprocessedPlatformTracks(platform),
  processorFunction: processorFunction(platform),
  initialCursor: undefined,
});
