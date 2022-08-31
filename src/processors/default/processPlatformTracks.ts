import _ from 'lodash';

import { DBClient, Table } from '../../db/db';
import { fromDBRecords } from '../../db/orm';
import { NFTsWithoutTracks } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { NFT, NftFactory } from '../../types/nft';
import { NFTProcessError } from '../../types/nftProcessError';
import { MusicPlatform, MusicPlatformTypeConfig, platformConfigs } from '../../types/platform';
import { Clients, MapTrack, Processor, TrackAPIClient } from '../../types/processor';
import { Record } from '../../types/record';
import { ProcessedTrack, mergeProcessedTracks, NFTTrackJoin } from '../../types/track';

const name = 'processTracks';

const getNFTFactories = async (nfts: NFT[], dbClient: DBClient) => {
  if (nfts.length === 0) {
    throw new Error('Unexpected empty NFT array');
  }
  const nftFactoryAddresses = _.uniq(nfts.map((n: NFT) => n.contractAddress));
  const nftFactoryAddressesString = JSON.stringify(nftFactoryAddresses).replace(/\"/g, "'").replace('[', '(').replace(']', ')');
  const query = `select * from "${Table.nftFactories}" where id in ${nftFactoryAddressesString}`
  const nftFactories: NftFactory[] = fromDBRecords(Table.nftFactories, (await dbClient.rawSQL(
    query
  )).rows);
  return nftFactories;
}

const getAPITrackData = async (trackIds: string[], client: TrackAPIClient) => {
  const apiResponse = await client.fetchTracksByTrackId(trackIds);
  const apiTrackByTrackId = _.keyBy(apiResponse, 'trackId');
  return apiTrackByTrackId;
}

/* eslint-disable @typescript-eslint/indent */
const createTracks = async (
  newTrackIds: string[],
  trackMapping: { [trackId: string]: NFT[] },
  client: TrackAPIClient | null,
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
  let apiTrackData: any;
  if (client) {
    apiTrackData = await getAPITrackData(newTrackIds, client);
  }

  const newTracks: ProcessedTrack[] = [];
  const joins: NFTTrackJoin[] = [];
  const errorNFTs: NFTProcessError[] = [];
  const artistProfiles: ArtistProfile[] = [];

  newTrackIds.forEach(trackId => {
    const trackNFTs = trackMapping[trackId];
    const apiTrack = apiTrackData?.[trackId];
    if (client && !apiTrack) {
      trackNFTs.forEach(nft => {
        errorNFTs.push({
          nftId: nft.id,
          processError: `Missing api track`
        });
      })
      return undefined;
    }
    const primaryNFTForTrack = selectPrimaryNFTForTrackMapper ? selectPrimaryNFTForTrackMapper(trackNFTs) : trackNFTs[0];
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
  });

  const uniqueArtistProfiles = _.uniqBy(artistProfiles, 'artistId');

  return { newTracks, joins, errorNFTs, artistProfiles: uniqueArtistProfiles };
}

const processNFTFactory = async (platform: MusicPlatform,
  platformType: MusicPlatformTypeConfig, nftFactory: NftFactory, nfts: NFT[],
  clients: Clients): Promise<{
  newTracks: ProcessedTrack[],
  joins: NFTTrackJoin[],
  errorNFTs: NFTProcessError[],
  artistProfiles: ArtistProfile[]
}> => {
  const platformClient = (clients as any)[platform.id];

  const overrideTypeName = nftFactory.typeMetadata?.overrides.type;
  let type = platformType;

  if (overrideTypeName) {
    const overrideType = platformConfigs[overrideTypeName];
    if (!overrideType) {
      const errorNFTs = nfts.map(nft => ({
        nftId: nft.id,
        processError: `Missing override type for nft_factory ${nftFactory.address}`
      }));
      return {
        newTracks: [],
        joins: [],
        errorNFTs,
        artistProfiles: []
      }
    } else {
      type = overrideType;
    }
  }

  const { mapNFTsToTrackIds, mapTrack, mapArtistProfile, selectPrimaryNFTForTrackMapper } = type.mappers;

  const trackMapping = await mapNFTsToTrackIds(nfts, clients.db);
  const trackIds = Object.keys(trackMapping);
  const existingTrackIds = await clients.db.recordsExist(Table.processedTracks, trackIds);
  const newTrackIds = trackIds.filter(id => !existingTrackIds.includes(id));
  const result = await createTracks(
    newTrackIds,
    trackMapping,
    platformClient,
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

const processorFunction = (platform: MusicPlatform) => async (nfts: NFT[], clients: Clients) => {
  console.log(`Getting ${platform.id} API tracks for ids: ${nfts.map(nft => nft.id)}`);
  const platformType = platformConfigs[platform.type];
  if (!platformType) {
    const errorNFTs = nfts.map(nft => ({
      nftId: nft.id,
      processError: `Missing platform type for platform ${platform.id}`
    }))
    await clients.db.upsert(Table.nftProcessErrors, errorNFTs, 'nftId', ['processError']);
    return;
  }

  const nftsByFactoryId = _.groupBy(nfts, nft => nft.contractAddress);

  const nftFactories = await getNFTFactories(nfts, clients.db);

  let allNewTracks: ProcessedTrack[] = [];
  let allJoins: NFTTrackJoin[] = [];
  let allErrorNFTs: NFTProcessError[] = [];
  let allArtistProfiles: ArtistProfile[] = [];

  for (const nftFactory of nftFactories) {
    const result = await processNFTFactory(
      platform, platformType, nftFactory, nftsByFactoryId[nftFactory.address], clients
    );
    allNewTracks = allNewTracks.concat(result.newTracks);
    allJoins = allJoins.concat(result.joins);
    allErrorNFTs = allErrorNFTs.concat(result.errorNFTs);
    allArtistProfiles = allArtistProfiles.concat(result.artistProfiles);
  }

  const artists = allArtistProfiles.map(profile => mapArtist(profile));

  const { oldIds, mergedProcessedTracks } = await mergeProcessedTracks(allNewTracks, clients.db, true);

  if (allErrorNFTs.length !== 0) {
    await clients.db.upsert(Table.nftProcessErrors, allErrorNFTs, 'nftId', ['processError']);
  }
  if (oldIds && oldIds.length !== 0) {
    await clients.db.delete(Table.processedTracks, oldIds);
  }
  await clients.db.upsert(Table.artists, artists);
  await clients.db.upsert(Table.artistProfiles, (allArtistProfiles as unknown as Record[]), ['artistId', 'platformId']);
  await clients.db.upsert(Table.processedTracks, mergedProcessedTracks);
  await clients.db.insert(Table.nfts_processedTracks, allJoins);
};

export const processPlatformTracks: (platform: MusicPlatform, limit?: number) => Processor =
  (platform: MusicPlatform, limit?: number) => ({
    name,
    trigger: NFTsWithoutTracks(platform.id, limit),
    processorFunction: processorFunction(platform),
    initialCursor: undefined,
  });
