import _ from 'lodash';
import { unprocessedCatalogTracks } from '../../triggers/missing';
import { getTokenIdFromTrack } from '../../types/platforms/catalog';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/track';

const name = 'processCatalogTracks';

const mergeCatalogResponse = (trackTokenIds: string[], catalogTracks: any) => {
  const catalogTrackData: { id: string, platformMetadata?: any }[] = trackTokenIds.map(id => ({ id }));
  const catalogTrackDataById = _.keyBy(catalogTrackData, 'id');
  catalogTracks.forEach((catalogTrackResponse: any) => {
    if (catalogTrackDataById[catalogTrackResponse.nft_id]) {
      catalogTrackDataById[catalogTrackResponse.nft_id].platformMetadata = catalogTrackResponse;
    }
  });
  return catalogTrackData;
}

const processorFunction = async (tracks: Track[], clients: Clients) => {
  const trackTokenIds = tracks.map(t => getTokenIdFromTrack(t));
  console.log(`Getting catalog API tracks for nfts: ${trackTokenIds}`)
  const catalogTracks = await clients.catalog.fetchCatalogTracksByNFT(trackTokenIds);
  const catalogTrackData = mergeCatalogResponse(trackTokenIds, catalogTracks);
  console.log({ catalogTrackData });
  process.exit(0);
  // const artists = ...
  // const newArtistProfiles = await ...
  // const newArtists = await ...
  // const updatedArtists = await ...
};

export const processCatalogTracks: Processor = {
  name,
  trigger: unprocessedCatalogTracks,
  processorFunction,
  initialCursor: undefined,
};
