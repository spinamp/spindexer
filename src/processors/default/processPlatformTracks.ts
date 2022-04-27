import _ from 'lodash';

import { Table } from '../../db/db';
import { erc721NFTsWithoutTracks } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { ERC721NFT } from '../../types/erc721nft';
import { MusicPlatform, platformConfig } from '../../types/platform';
import { Clients, Processor, TrackAPIClient } from '../../types/processor';
import { Record } from '../../types/record';
import { ProcessedTrack, mergeProcessedTracks, NFTProcessError, NFTTrackJoin } from '../../types/track';

type ImplementedMusicPlatform = MusicPlatform.catalog | MusicPlatform.sound | MusicPlatform.noizd;

const name = 'processTracks';

const getAPITrackData = async (trackIds: string[], client: TrackAPIClient) => {
  const apiResponse = await client.fetchTracksByTrackId(trackIds);
  const apiTrackByTrackId = _.keyBy(apiResponse, 'trackId');
  return apiTrackByTrackId;
}

const createTracks =  async (
  newTrackIds:string[],
  trackMapping: { [trackId: string]:ERC721NFT[] },
  client: TrackAPIClient,
  mapTrack: (nft: ERC721NFT, apiTrack: any) => ProcessedTrack,
  mapArtistProfile: (apiTrack: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string) => ArtistProfile):
Promise<{
  newTracks: ProcessedTrack[],
  joins: NFTTrackJoin[],
  errorNFTs: NFTProcessError[],
  artistProfiles: ArtistProfile[]
}> => {
  if(newTrackIds.length === 0) {
    return {
      newTracks: [],
      joins: [],
      errorNFTs: [],
      artistProfiles: []
    }
  }
  const apiTrackData = await getAPITrackData(newTrackIds, client);

  const newTracks:ProcessedTrack[] = [];
  const joins:NFTTrackJoin[] = [];
  const errorNFTs:NFTProcessError[] = [];
  const artistProfiles:ArtistProfile[] = [];

  newTrackIds.forEach(trackId => {
    const trackNFTs = trackMapping[trackId];
    const apiTrack = apiTrackData[trackId];
    if(!apiTrack) {
      trackNFTs.forEach(nft => {
        errorNFTs.push({
          erc721nftId: nft.id,
          processError: `Missing api track`
        });
      })
      return undefined;
    }

    newTracks.push(mapTrack(trackNFTs[0], apiTrack));
    trackNFTs.forEach(nft => {
      joins.push({
        erc721nftId: nft.id,
        processedTrackId: trackId
      });
    })

    const artistProfile = {
      ...mapArtistProfile(apiTrack, trackNFTs[0].createdAtTime, trackNFTs[0].createdAtEthereumBlockNumber),
    } as ArtistProfile;
    artistProfiles.push(artistProfile);
  });

  const uniqueArtistProfiles = _.uniqBy(artistProfiles, 'artistId');

  return { newTracks, joins, errorNFTs, artistProfiles: uniqueArtistProfiles };
}

const processorFunction = (platformId: Partial<ImplementedMusicPlatform>) => async (nfts: ERC721NFT[], clients: Clients) => {
  console.log(`Getting ${platformId} API tracks for ids: ${nfts.map(n => n.id)}`);
  const platformMapper = platformConfig[platformId].mappers;
  if (!platformMapper) {
    throw new Error(`Platform mapper for ${platformId} not found`);
  }
  const { mapNFTsToTrackIds, mapTrack, mapArtistProfile } = platformMapper;

  const trackMapping = mapNFTsToTrackIds(nfts);
  const trackIds = Object.keys(trackMapping);
  const existingTrackIds = await clients.db.recordsExist(Table.processedTracks, trackIds);
  const newTrackIds = trackIds.filter(id => !existingTrackIds.includes(id));
  const { newTracks, joins, errorNFTs, artistProfiles } = await createTracks(
    newTrackIds,
    trackMapping,
    clients[platformId],
    mapTrack,
    mapArtistProfile
    );
  const artists = artistProfiles.map(profile => mapArtist(profile));

  const { oldIds, mergedProcessedTracks } = await mergeProcessedTracks(newTracks, clients.db, true);

  if (existingTrackIds && existingTrackIds.length !== 0) {
    existingTrackIds.map(trackId => {
      const trackNFTs = trackMapping[trackId];
      trackNFTs.forEach(nft => {
        joins.push({
          erc721nftId: nft.id,
          processedTrackId: trackId
        });
      })
    });
  }
  if (errorNFTs.length !== 0) {
    await clients.db.insert(Table.erc721nftProcessErrors, errorNFTs);
  }
  if (oldIds && oldIds.length !== 0) {
    await clients.db.delete(Table.processedTracks, oldIds);
  }
  await clients.db.upsert(Table.artists, artists);
  await clients.db.upsert(Table.artistProfiles, (artistProfiles as unknown as Record[]), ['artistId', 'platformId']);
  await clients.db.upsert(Table.processedTracks, mergedProcessedTracks);
  await clients.db.insert(Table.erc721nfts_processedTracks, joins);
};

export const processPlatformTracks: (platformId: ImplementedMusicPlatform, limit?:number) => Processor =
  (platformId: ImplementedMusicPlatform, limit?: number) => ({
    name,
    trigger: erc721NFTsWithoutTracks(platformId, limit),
    processorFunction: processorFunction(platformId),
    initialCursor: undefined,
  });
