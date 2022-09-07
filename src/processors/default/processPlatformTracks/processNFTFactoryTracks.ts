import _ from 'lodash';

import { DBClient, Table } from '../../../db/db';
import { ArtistProfile } from '../../../types/artist';
import { NFT, NftFactory } from '../../../types/nft';
import { NFTProcessError } from '../../../types/nftProcessError';
import { MusicPlatformTypeConfig, platformConfigs } from '../../../types/platform';
import { MapNFTsToTrackIds, MapTrack, TrackAPIClient } from '../../../types/processor';
import { ProcessedTrack, NFTTrackJoin } from '../../../types/track';

const name = 'processTracks';

const getAPITrackData = async (trackIds: string[], client: TrackAPIClient) => {
  const apiResponse = await client.fetchTracksByTrackId(trackIds);
  const apiTrackByTrackId = _.keyBy(apiResponse, 'trackId');
  return apiTrackByTrackId;
}

/* eslint-disable @typescript-eslint/indent */
const createTracks = async (
  newTrackIds: string[],
  trackMapping: { [trackId: string]: NFT[] },
  apiTrackData: any,
  mapTrack: MapTrack,
  mapArtistProfile: ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory | undefined }) => ArtistProfile,
  nftFactory: NftFactory,
  selectPrimaryNFTForTrackMapper?: (nfts: NFT[]) => NFT
):
  Promise<{
    newTracks: ProcessedTrack[],
    joins: NFTTrackJoin[],
    errorNFTs: NFTProcessError[],
    artistProfiles: ArtistProfile[]
  }> => {
  if (newTrackIds.length === 0) {
    return {
      newTracks: [],
      joins: [],
      errorNFTs: [],
      artistProfiles: []
    }
  }
  const newTracks: ProcessedTrack[] = [];
  const joins: NFTTrackJoin[] = [];
  const errorNFTs: NFTProcessError[] = [];
  const artistProfiles: ArtistProfile[] = [];

  newTrackIds.forEach(trackId => {
    const trackNFTs = trackMapping[trackId];
    const apiTrack = apiTrackData?.[trackId];
    const primaryNFTForTrack = selectPrimaryNFTForTrackMapper ? selectPrimaryNFTForTrackMapper(trackNFTs) : trackNFTs[0];
    try {
      const mappedTrack = mapTrack(primaryNFTForTrack, apiTrack, nftFactory, trackId);
      if (!mappedTrack) {
        return;
      }
      newTracks.push(mappedTrack);
      trackNFTs.forEach(nft => {
        joins.push({
          nftId: nft.id,
          processedTrackId: trackId
        });
      })

      const artistProfile = {
        ...mapArtistProfile({ apiTrack, nft: trackNFTs[0], contract: nftFactory }),
      } as ArtistProfile;
      artistProfiles.push(artistProfile);
    } catch (error) {
      trackNFTs.forEach(nft => {
        errorNFTs.push({
          nftId: nft.id,
          processError: `Error mapping track: ${error}`
        });
      })
      return;
    }
  });

  const uniqueArtistProfiles = _.uniqBy(artistProfiles, 'artistId');

  return { newTracks, joins, errorNFTs, artistProfiles: uniqueArtistProfiles };
}

export const getTrackInputs = async (
  mapNFTsToTrackIds: MapNFTsToTrackIds,
  nfts: NFT[],
  dbClient: DBClient,
  apiTracksByNFT: any,
  contract: NftFactory
  ) => {
  const trackMapping = mapNFTsToTrackIds(nfts, dbClient, apiTracksByNFT, contract);
  const trackIds = Object.keys(trackMapping);
  const existingTrackIds = await dbClient.recordsExist(Table.processedTracks, trackIds);
  const newTrackIds = trackIds.filter(id => !existingTrackIds.includes(id));

  return {
    newTrackIds,
    trackMapping,
    existingTrackIds,
  }
}

export const getNFTFactoryType = (nftFactory: NftFactory, defaultType: MusicPlatformTypeConfig) => {
  const overrideTypeName = nftFactory.typeMetadata?.overrides.type;
  if (overrideTypeName) {
    const type = platformConfigs[overrideTypeName];
    if (!type) {
      throw new Error(`Missing type for nft_factory ${nftFactory.id}`)
    }
    return type;
  } else {
    return defaultType;
  }
}

// export const getTrackIds = async (defaultType: MusicPlatformTypeConfig, nftFactory: NftFactory, nfts: NFT[], dbClient: DBClient) => {
//   const nftFactoryType = getNFTFactoryType(nftFactory, defaultType);
//   if (!nftFactoryType) {
//     return [];
//   }
//   const trackMapping = await nftFactoryType.mappers.mapNFTsToTrackIds(nfts, dbClient);
//   const trackIds = Object.keys(trackMapping);
//   return trackIds;
// }

export type ProcessNFTFactoryTracksInput = {
  nftFactory: NftFactory, // The NFT Factory
  nftFactoryType: MusicPlatformTypeConfig, // The default mapper type for this factory in the case there is no override
  trackMapping: { // A mapping of track ids to nfts for these nfts
      [trackId: string]: NFT[];
  },
  newTrackIds: string[], // The list of track ids that are newly discovered
  existingTrackIds: string[], // The list of track ids that already exist
  apiTrackData: any // Any additional API data for the tracks that is needed for processing
}

export const processNFTFactoryTracks = async ({
  nftFactory,
  nftFactoryType,
  trackMapping,
  newTrackIds,
  existingTrackIds,
  apiTrackData
  }: ProcessNFTFactoryTracksInput): Promise<{
  newTracks: ProcessedTrack[],
  joins: NFTTrackJoin[],
  errorNFTs: NFTProcessError[],
  artistProfiles: ArtistProfile[]
}> => {
  const { mapTrack, mapArtistProfile, selectPrimaryNFTForTrackMapper } = nftFactoryType.mappers;

  const result = await createTracks(
    newTrackIds,
    trackMapping,
    apiTrackData,
    mapTrack,
    mapArtistProfile,
    nftFactory,
    selectPrimaryNFTForTrackMapper
  );

  if (existingTrackIds && existingTrackIds.length !== 0) {
    existingTrackIds.map(trackId => {
      const trackNFTs = trackMapping[trackId];
      trackNFTs.forEach(nft => {
        result.joins.push({
          nftId: nft.id,
          processedTrackId: trackId
        });
      })
    });
  }

  return result;

};
