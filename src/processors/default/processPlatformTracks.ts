import _ from 'lodash';
import { unprocessedPlatformTracks } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { Record, RecordUpdate } from '../../types/record';
import { MusicPlatform, platformConfig, PlatformMapper } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';
import { Track, ProcessedTrack, mergeProcessedTracks } from '../../types/track';

type ImplementedMusicPlatform = MusicPlatform.catalog | MusicPlatform.sound | MusicPlatform.noizd;

const name = 'processTracks';

const processPlatformTrackData = (platformTrackData: {
  track: Track;
  platformTrackResponse: unknown;
}[], platformMapper: PlatformMapper) => {
  const { mapArtistProfile, mapTrack } = platformMapper;

  const { processedTracks, trackUpdates } = platformTrackData.reduce<
    { processedTracks: ProcessedTrack[], trackUpdates: RecordUpdate<Track>[] }>
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
        ...mapArtistProfile(trackData.platformTrackResponse, trackData.track.createdAtTime, trackData.track.createdAtEthereumBlockNumber),
      } as ArtistProfile;
      profiles.push(artistProfile);
    }
    return profiles
  }, []), 'artistId');
  const artists = artistProfiles.map(profile => mapArtist(profile));
  return {
    processedTracks, trackUpdates, artists, artistProfiles,
  };
}

const processorFunction = (platformId: Partial<ImplementedMusicPlatform>) => async (tracks: Track[], clients: Clients) => {
  console.log(`Getting ${platformId} API tracks for ids: ${tracks.map(t => t.id)}`);
  const platformMapper = platformConfig[platformId].mappers;
  if (!platformMapper) {
    throw new Error(`Platform mapper for ${platformId} not found`);
  }
  const platformTrackData = await platformMapper.addPlatformTrackData(tracks, clients[platformId]);

  const { processedTracks, trackUpdates, artists, artistProfiles } = processPlatformTrackData(platformTrackData, platformMapper);
  const { oldIds, mergedProcessedTracks } = await mergeProcessedTracks(processedTracks, clients.db, true);

  await clients.db.update('tracks', trackUpdates);
  if (oldIds) {
    await clients.db.delete('processedTracks', oldIds);
  }
  await clients.db.upsert('artists', artists);
  await clients.db.upsert('artistProfiles', (artistProfiles as unknown as Record[]), ['artistId', 'platformId']);
  await clients.db.upsert('processedTracks', mergedProcessedTracks);
};

export const processPlatformTracks: (platformId: ImplementedMusicPlatform, limit?:number) => Processor =
  (platformId: ImplementedMusicPlatform, limit?: number) => ({
    name,
    trigger: unprocessedPlatformTracks(platformId, limit),
    processorFunction: processorFunction(platformId),
    initialCursor: undefined,
  });
