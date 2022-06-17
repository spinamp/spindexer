import _ from 'lodash';

import { DBClient, Table } from '../../db/db';
import { fromDBRecords } from '../../db/orm';
import { erc721NFTsWithoutTracks } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract } from '../../types/ethereum';
import { MusicPlatform, platformConfigs } from '../../types/platform';
import { Clients, Processor, TrackAPIClient } from '../../types/processor';
import { Record } from '../../types/record';
import { ProcessedTrack, mergeProcessedTracks, NFTProcessError, NFTTrackJoin } from '../../types/track';

const name = 'processTracks';

const getNFTContracts = async (nfts: ERC721NFT[], dbClient: DBClient) => {
  if (nfts.length === 0) {
    throw new Error('Unexpected empty NFT array');
  }
  const contractAddresses = _.uniq(nfts.map((n: ERC721NFT) => n.contractAddress));
  const contractAddressesString = JSON.stringify(contractAddresses).replace(/\"/g, "'").replace('[', '(').replace(']', ')');
  const contractQuery = `select * from "${Table.erc721Contracts}" where id in ${contractAddressesString}`
  const contracts: ERC721Contract[] = fromDBRecords(Table.erc721Contracts, (await dbClient.rawSQL(
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
  trackMapping: { [trackId: string]: ERC721NFT[] },
  client: TrackAPIClient | null,
  mapTrack: (nft: ERC721NFT, apiTrack: any, contract?: ERC721Contract | undefined, trackId?: string) => ProcessedTrack,
  mapArtistProfile: ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract | undefined }) => ArtistProfile,
  contracts: ERC721Contract[]):
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
          erc721nftId: nft.id,
          processError: `Missing api track`
        });
      })
      return undefined;
    }
    const firstNFT = trackNFTs[0];
    const contract = contracts.find(c => c.address === firstNFT.contractAddress)
    const mappedTrack = mapTrack(firstNFT, apiTrack, contract, trackId);
    if (!mappedTrack) {
      return;
    }

    newTracks.push(mappedTrack);
    trackNFTs.forEach(nft => {
      joins.push({
        erc721nftId: nft.id,
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

const processorFunction = (platform: MusicPlatform) => async (nfts: ERC721NFT[], clients: Clients) => {
  console.log(`Getting ${platform.id} API tracks for ids: ${nfts.map(nft => nft.id)}`);
  const platformType = platformConfigs[platform.type];
  if (!platformType) {
    const errorNFTs = nfts.map(nft => ({
      erc721nftId: nft.id,
      processError: `Missing platform type for ${platform.id}`
    }))
    await clients.db.insert(Table.erc721nftProcessErrors, errorNFTs);
    return;
  }
  let platformClient: TrackAPIClient | null = null;
  if (platformType.clientName) {
    platformClient = (clients as any)[platformType.clientName];
  }
  if (!platformClient && platformType.clientName !== null) {
    const errorNFTs = nfts.map(nft => ({
      erc721nftId: nft.id,
      processError: `Missing platform client`
    }))
    await clients.db.insert(Table.erc721nftProcessErrors, errorNFTs);
    return;
  }
  const { mapNFTsToTrackIds, mapTrack, mapArtistProfile } = platformType.mappers;

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
    contracts
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

export const processPlatformTracks: (platform: MusicPlatform, limit?: number) => Processor =
  (platform: MusicPlatform, limit?: number) => ({
    name,
    trigger: erc721NFTsWithoutTracks(platform.id, limit),
    processorFunction: processorFunction(platform),
    initialCursor: undefined,
  });
