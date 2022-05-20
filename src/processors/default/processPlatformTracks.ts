import _ from 'lodash';

import { Table } from '../../db/db';
import { erc721NFTsWithoutTracks } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { ERC721NFT } from '../../types/erc721nft';
import { MusicPlatform, platformConfigs } from '../../types/platform';
import { Clients, Processor, TrackAPIClient } from '../../types/processor';
import { Record } from '../../types/record';
import { ProcessedTrack, mergeProcessedTracks, NFTProcessError, NFTTrackJoin } from '../../types/track';

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
  mapArtistProfile: ({ apiTrack, nft }: { apiTrack: any, nft?: ERC721NFT }) => ArtistProfile):
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
    const mappedTrack = mapTrack(trackNFTs[0], apiTrack);
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
      ...mapArtistProfile({ apiTrack, nft:trackNFTs[0] }),
    } as ArtistProfile;
    artistProfiles.push(artistProfile);
  });

  const uniqueArtistProfiles = _.uniqBy(artistProfiles, 'artistId');

  return { newTracks, joins, errorNFTs, artistProfiles: uniqueArtistProfiles };
}

const processorFunction = (platform: MusicPlatform) => async (nfts: ERC721NFT[], clients: Clients) => {
  console.log(`Getting ${platform.id} API tracks for ids: ${nfts.map(n => n.id)}`);
  const platformType = platformConfigs[platform.type];
  if (!platformType) {
    const errorNFTs = nfts.map(nft => ({
        erc721nftId: nft.id,
        processError: `Missing platform type for ${platform.id}`
    }))
    await clients.db.insert(Table.erc721nftProcessErrors, errorNFTs);
    return;
  }
  const platformClient = (clients as any)[platform.type];
  if (!platformClient) {
    const errorNFTs = nfts.map(nft => ({
        erc721nftId: nft.id,
        processError: `Missing platform client`
    }))
    await clients.db.insert(Table.erc721nftProcessErrors, errorNFTs);
    return;
  }
  const { mapNFTsToTrackIds, mapTrack, mapArtistProfile } = platformType.mappers;

  const trackMapping = mapNFTsToTrackIds(nfts);
  const trackIds = Object.keys(trackMapping);
  const existingTrackIds = await clients.db.recordsExist(Table.processedTracks, trackIds);
  const newTrackIds = trackIds.filter(id => !existingTrackIds.includes(id));
  const { newTracks, joins, errorNFTs, artistProfiles } = await createTracks(
    newTrackIds,
    trackMapping,
    platformClient,
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

export const processPlatformTracks: (platform: MusicPlatform, limit?:number) => Processor =
  (platform: MusicPlatform, limit?: number) => ({
    name,
    trigger: erc721NFTsWithoutTracks(platform.id, limit),
    processorFunction: processorFunction(platform),
    initialCursor: undefined,
  });
