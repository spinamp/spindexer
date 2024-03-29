import _ from 'lodash';

import { DBClient, Table } from '../../../db/db';
import { fromDBRecords } from '../../../db/orm';
import { NFTsWithoutTracks } from '../../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../../types/artist';
import { NFTtoTrackIdsInput } from '../../../types/mapping';
import { NFT, NftFactory } from '../../../types/nft';
import { NFTProcessError } from '../../../types/nftProcessError';
import { MusicPlatform, MusicPlatformTypeConfig, platformConfigs } from '../../../types/platform';
import { Clients, Processor, TrackAPIClient } from '../../../types/processor';
import { Record } from '../../../types/record';
import { ProcessedTrack, mergeProcessedTracks, NFTTrackJoin } from '../../../types/track';

import { ProcessNFTFactoryTracksInput, processNFTFactoryTracks, getNFTFactoryType, getTrackInputs } from './processNFTFactoryTracks';

const getNFTFactories = async (nfts: NFT[], dbClient: DBClient) => {
  if (nfts.length === 0) {
    throw new Error('Unexpected empty NFT array');
  }
  const nftFactoryIds = _.uniq(nfts.map((n: NFT) => n.nftFactoryId));
  const nftFactoryIdsString = JSON.stringify(nftFactoryIds).replace(/\"/g, "'").replace('[', '(').replace(']', ')');
  const query = `select * from "${Table.nftFactories}" where id in ${nftFactoryIdsString}`
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
const processorFunction = (platform: MusicPlatform) => async (nfts: NFT[], clients: Clients) => {
  console.log(`Processing ${platform.id} tracks for ids: ${nfts.map(nft => nft.id)}`);
  const platformType = platformConfigs[platform.type];
  if (!platformType) {
    const errorNFTs = nfts.map(nft => ({
      nftId: nft.id,
      processError: `Missing platform type for platform ${platform.id}`
    }))
    await clients.db.upsert(Table.nftProcessErrors, errorNFTs, 'nftId', ['processError', 'processErrorName']);
    return;
  }
  const platformClient = (clients as any)[platform.id];
  const nftFactories = await getNFTFactories(nfts, clients.db);
  const nftsByFactoryId = _.groupBy(nfts, nft => nft.nftFactoryId);
  const nftFactoriesById = _.keyBy(nftFactories, factory => factory.id);
  const nftsForApiTracks = nfts.filter(nft => {
    const factory = nftFactoriesById[nft.nftFactoryId];
    if (!factory) {
      throw new Error(`Unexpected nft with no factory: ${nft.id}`);
    }
    const type = getNFTFactoryType(factory, platformType);
    if (type.skipApiTracks) {
      return false;
    }
    return true;
  });
  let apiTracksByNFT;
  if (platformClient && platformClient.fetchTracksByNFT && nftsForApiTracks.length !== 0) {
    console.log(`Querying ${platform.id} API tracks for ids: ${nftsForApiTracks.map(nft => nft.id)}`);
    apiTracksByNFT = await platformClient.fetchTracksByNFT(nftsForApiTracks);
  }

  let allNewTracks: ProcessedTrack[] = [];
  let allJoins: NFTTrackJoin[] = [];
  let allErrorNFTs: NFTProcessError[] = [];
  let allArtistProfiles: ArtistProfile[] = [];

  const inputsforNFTFactoryProcessing: Omit<ProcessNFTFactoryTracksInput, 'apiTrackData'>[] = [];

  for (const nftFactory of nftFactories) {
    const factoryNFTs = nftsByFactoryId[nftFactory.id];
    const nftToTrackIdInput: NFTtoTrackIdsInput = {
      nfts: factoryNFTs,
      apiTracksByNFT: apiTracksByNFT,
      contract: nftFactory
    }

    let nftFactoryType: MusicPlatformTypeConfig;
    try {
      nftFactoryType = getNFTFactoryType(nftFactory, platformType);
      const {
        newTrackIds,
        trackMapping,
        existingTrackIds,
        nftsWithoutTracks,
      } = await getTrackInputs(nftFactoryType.mappers.mapNFTsToTrackIds, nftToTrackIdInput, clients.db);
      const input = {
        nftFactory,
        nftFactoryType,
        trackMapping,
        newTrackIds,
        existingTrackIds,
      }
      inputsforNFTFactoryProcessing.push(input);
      nftsWithoutTracks?.map(nft => allErrorNFTs.push({
        nftId: nft.id,
        processError: `Error on ${nft.id}: null id`,
      }));
    } catch (e) {
      factoryNFTs.map(nft => allErrorNFTs.push({
        nftId: nft.id,
        processError: e as string,
      }));
    }
  }

  const newTrackIdsForAPI: string[] = inputsforNFTFactoryProcessing.map(i => {
    if (i.nftFactoryType.skipApiTracks) {
      return [];
    } else {
      return i.newTrackIds
    }
  }).flat().filter((id): id is string => !!id);
  let apiTrackData: any;
  if (platformClient && newTrackIdsForAPI.length > 0) {
    apiTrackData = await getAPITrackData(newTrackIdsForAPI, platformClient);
  }

  for (const input of inputsforNFTFactoryProcessing) {
    const result = await processNFTFactoryTracks({ ...input, apiTrackData });
    allNewTracks = allNewTracks.concat(result.newTracks);
    allJoins = allJoins.concat(result.joins);
    allErrorNFTs = allErrorNFTs.concat(result.errorNFTs);
    allArtistProfiles = allArtistProfiles.concat(result.artistProfiles);
  }

  const artists = allArtistProfiles.map(profile => mapArtist(profile));

  const { oldIds, mergedProcessedTracks } = await mergeProcessedTracks(allNewTracks, clients.db, true);

  if (allErrorNFTs.length !== 0) {
    await clients.db.upsert(Table.nftProcessErrors, allErrorNFTs, 'nftId', ['processError', 'processErrorName']);
  }
  if (oldIds && oldIds.length !== 0) {
    await clients.db.delete(Table.processedTracks, oldIds);
  }
  await clients.db.insert(Table.artists, artists, { ignoreConflict: 'id' });
  await clients.db.upsert(Table.artistProfiles, (allArtistProfiles as unknown as Record[]), ['artistId', 'platformId']);
  await clients.db.upsert(Table.processedTracks, mergedProcessedTracks);
  await clients.db.insert(Table.nfts_processedTracks, allJoins);
};

export const processPlatformTracks: (platform: MusicPlatform, limit?: number) => Processor =
  (platform: MusicPlatform, limit?: number) => ({
    name: 'processPlatformTracks',
    trigger: NFTsWithoutTracks(platform.id, limit),
    processorFunction: processorFunction(platform),
    initialCursor: undefined,
  });
