import _ from 'lodash';

import { unprocessedPlatformMetadatas } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { Metadata } from '../../types/metadata';
import { MusicPlatform, platformConfig, PlatformMapper } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';
import { Record, RecordUpdate } from '../../types/record';
import { ProcessedTrack, mergeProcessedTracks } from '../../types/track';

type ImplementedMusicPlatform = MusicPlatform.catalog | MusicPlatform.sound | MusicPlatform.noizd;

const name = 'processTracks';

const processPlatformTrackData = (platformTrackData: {
  metadata: Metadata;
  platformTrackResponse: unknown;
}[], platformMapper: PlatformMapper) => {
  const { mapArtistProfile, mapTrack } = platformMapper;

  const { processedTracks, metadataUpdates } = platformTrackData.reduce<
    { processedTracks: ProcessedTrack[], metadataUpdates: RecordUpdate<Metadata>[] }>
    ((accum, item) => {
      if (item.platformTrackResponse) {
        const processedTrack = mapTrack(item)
        accum.processedTracks.push(processedTrack);
        accum.metadataUpdates.push({
          id: item.metadata.id,
          processed: true,
        });
      } else {
        accum.metadataUpdates.push({
          id: item.metadata.id,
          processed: true,
          processError: true,
        });
      }
      return accum;
    },
      { processedTracks: [], metadataUpdates: [] }
    );
  const artistProfiles = _.uniqBy(platformTrackData.reduce<ArtistProfile[]>((profiles, item) => {
    if (item.platformTrackResponse) {
      const artistProfile = {
        ...mapArtistProfile(item.platformTrackResponse, item.metadata.createdAtTime, item.metadata.createdAtEthereumBlockNumber),
      } as ArtistProfile;
      profiles.push(artistProfile);
    }
    return profiles
  }, []), 'artistId');
  const artists = artistProfiles.map(profile => mapArtist(profile));
  return {
    processedTracks, metadataUpdates, artists, artistProfiles,
  };
}

const processorFunction = (platformId: Partial<ImplementedMusicPlatform>) => async (metadatas: Metadata[], clients: Clients) => {
  console.log(`Getting ${platformId} API tracks for ids: ${metadatas.map(m => m.id)}`);
  const platformMapper = platformConfig[platformId].mappers;
  if (!platformMapper) {
    throw new Error(`Platform mapper for ${platformId} not found`);
  }
  const platformTrackData = await platformMapper.addPlatformTrackData(metadatas, clients[platformId]);

  const { processedTracks, metadataUpdates, artists, artistProfiles } = processPlatformTrackData(platformTrackData, platformMapper);
  const { oldIds, mergedProcessedTracks } = await mergeProcessedTracks(processedTracks, clients.db, true);

  await clients.db.update('metadatas', metadataUpdates);
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
    trigger: unprocessedPlatformMetadatas(platformId, limit),
    processorFunction: processorFunction(platformId),
    initialCursor: undefined,
  });
