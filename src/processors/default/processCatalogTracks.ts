import _ from 'lodash';
import { PartialRecord } from '../../db/db';
import { unprocessedCatalogTracks } from '../../triggers/missing';
import { Artist, ArtistProfile } from '../../types/artist';
import { getTokenIdFromTrack, mapCatalogArtist, mapCatalogArtistProfile, mapCatalogTrack } from '../../types/platforms/catalog';
import { Clients, Processor } from '../../types/processor';
import { Track, ProcessedTrack } from '../../types/track';

const name = 'processCatalogTracks';

const mergeCatalogResponse = (tracks: Track[], catalogTracks: any) => {
  const catalogTrackData: { tokenId: string, track: Track, catalogTrackResponse?: any }[]
    = tracks.map(track => ({ tokenId: getTokenIdFromTrack(track), track }));
  const catalogTrackDataByTokenId = _.keyBy(catalogTrackData, 'tokenId');
  catalogTracks.forEach((catalogTrackResponse: any) => {
    if (catalogTrackDataByTokenId[catalogTrackResponse.nft_id]) {
      catalogTrackDataByTokenId[catalogTrackResponse.nft_id].catalogTrackResponse = catalogTrackResponse;
    }
  });
  const { processedTracks, trackUpdates } = catalogTrackData.reduce<
    { processedTracks: Omit<ProcessedTrack, 'artistId' | 'artist'>[], trackUpdates: PartialRecord<Track>[] }>
    ((accum, item) => {
      accum.trackUpdates.push({
        id: item.track.id,
        processed: true,
      });
      if (item.catalogTrackResponse) {
        const processedTrack = mapCatalogTrack(item)
        accum.processedTracks.push(processedTrack);
      }
      return accum;
    },
      { processedTracks: [], trackUpdates: [] }
    );
  const artistProfiles = _.uniqBy(catalogTrackData.reduce<ArtistProfile[]>((profiles, trackData) => {
    if (trackData.catalogTrackResponse) {
      profiles.push(mapCatalogArtistProfile(trackData.catalogTrackResponse?.artist, trackData.track.createdAtBlockNumber));
    }
    return profiles
  }, []), 'artistId');
  const artists = artistProfiles.map(p => mapCatalogArtist(p));
  return {
    processedTracks, trackUpdates, artists,
  };
}

const processorFunction = async (tracks: Track[], clients: Clients) => {
  const trackTokenIds = tracks.map(t => getTokenIdFromTrack(t));
  console.log(`Getting catalog API tracks for nfts: ${trackTokenIds}`)
  const catalogTracks = await clients.catalog.fetchCatalogTracksByNFT(trackTokenIds);
  const { processedTracks, trackUpdates, artists } = mergeCatalogResponse(tracks, catalogTracks);
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

export const processCatalogTracks: Processor = {
  name,
  trigger: unprocessedCatalogTracks,
  processorFunction,
  initialCursor: undefined,
};
