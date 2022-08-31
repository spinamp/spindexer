import _ from 'lodash';

import { DBClient, Table } from '../../db/db';
import { fromDBRecords } from '../../db/orm';
import { NFTsWithoutTracks } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { NFT, NftFactory } from '../../types/nft';
import { NFTProcessError } from '../../types/nftProcessError';
import { MusicPlatform, platformConfigs } from '../../types/platform';
import { Clients, MapTrack, Processor, TrackAPIClient } from '../../types/processor';
import { Record } from '../../types/record';
import { ProcessedTrack, mergeProcessedTracks, NFTTrackJoin } from '../../types/track';

const name = 'processTracks';

const getNFTContracts = async (nfts: NFT[], dbClient: DBClient) => {
  if (nfts.length === 0) {
    throw new Error('Unexpected empty NFT array');
  }
  const contractAddresses = _.uniq(nfts.map((n: NFT) => n.contractAddress));
  const contractAddressesString = JSON.stringify(contractAddresses).replace(/\"/g, "'").replace('[', '(').replace(']', ')');
  const contractQuery = `select * from "${Table.nftFactories}" where id in ${contractAddressesString}`
  const contracts: NftFactory[] = fromDBRecords(Table.nftFactories, (await dbClient.rawSQL(
    contractQuery
  )).rows);
  return contracts;
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
  contracts: NftFactory[],
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
    const contract = contracts.find(c => c.address === primaryNFTForTrack.contractAddress)
    const mappedTrack = mapTrack(primaryNFTForTrack, apiTrack, contract, trackId);
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
      ...mapArtistProfile({ apiTrack, nft: trackNFTs[0], contract }),
    } as ArtistProfile;
    artistProfiles.push(artistProfile);
  });

  const uniqueArtistProfiles = _.uniqBy(artistProfiles, 'artistId');

  return { newTracks, joins, errorNFTs, artistProfiles: uniqueArtistProfiles };
}

const processorFunction = (platform: MusicPlatform) => async (nfts: NFT[], clients: Clients) => {
  console.log(`Getting ${platform.id} API tracks for ids: ${nfts.map(nft => nft.id)}`);
  const platformType = platformConfigs[platform.type];
  if (!platformType) {
    const errorNFTs = nfts.map(nft => ({
      nftId: nft.id,
      processError: `Missing platform type for ${platform.id}`
    }))
    await clients.db.upsert(Table.nftProcessErrors, errorNFTs, 'nftId', ['processError']);
    return;
  }
  let platformClient: TrackAPIClient | null = null;
  if (platformType.clientName) {
    platformClient = (clients as any)[platformType.clientName];
  }
  if (!platformClient && platformType.clientName !== null) {
    const errorNFTs = nfts.map(nft => ({
      nftId: nft.id,
      processError: `Missing platform client`
    }))
    await clients.db.upsert(Table.nftProcessErrors, errorNFTs, 'nftId', ['processError']);
    return;
  }
  const { mapNFTsToTrackIds, mapTrack, mapArtistProfile, selectPrimaryNFTForTrackMapper } = platformType.mappers;

  const contracts = await getNFTContracts(nfts, clients.db);
  const trackMapping = await mapNFTsToTrackIds(nfts, clients.db);
  const trackIds = Object.keys(trackMapping);
  const existingTrackIds = await clients.db.recordsExist(Table.processedTracks, trackIds);
  const newTrackIds = trackIds.filter(id => !existingTrackIds.includes(id));
  const { newTracks, joins, errorNFTs, artistProfiles } = await createTracks(
    newTrackIds,
    trackMapping,
    platformClient,
    mapTrack,
    mapArtistProfile,
    contracts,
    selectPrimaryNFTForTrackMapper
  );
  const artists = artistProfiles.map(profile => mapArtist(profile));

  const { oldIds, mergedProcessedTracks } = await mergeProcessedTracks(newTracks, clients.db, true);

  if (existingTrackIds && existingTrackIds.length !== 0) {
    existingTrackIds.map(trackId => {
      const trackNFTs = trackMapping[trackId];
      trackNFTs.forEach(nft => {
        joins.push({
          nftId: nft.id,
          processedTrackId: trackId
        });
      })
    });
  }
  if (errorNFTs.length !== 0) {
    await clients.db.upsert(Table.nftProcessErrors, errorNFTs, 'nftId', ['processError']);
  }
  if (oldIds && oldIds.length !== 0) {
    await clients.db.delete(Table.processedTracks, oldIds);
  }
  await clients.db.upsert(Table.artists, artists);
  await clients.db.upsert(Table.artistProfiles, (artistProfiles as unknown as Record[]), ['artistId', 'platformId']);
  await clients.db.upsert(Table.processedTracks, mergedProcessedTracks);
  await clients.db.insert(Table.nfts_processedTracks, joins);
};

export const processPlatformTracks: (platform: MusicPlatform, limit?: number) => Processor =
  (platform: MusicPlatform, limit?: number) => ({
    name,
    trigger: NFTsWithoutTracks(platform.id, limit),
    processorFunction: processorFunction(platform),
    initialCursor: undefined,
  });
