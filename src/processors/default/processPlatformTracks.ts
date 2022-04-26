import _ from 'lodash';

import { Table } from '../../db/db';
import { erc721NFTsWithoutTracks } from '../../triggers/missing';
import { ArtistProfile, mapArtist } from '../../types/artist';
import { ERC721NFT } from '../../types/erc721nft';
import { MusicPlatform, platformConfig } from '../../types/platform';
// import { MusicPlatform, platformConfig, PlatformMapper } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';
import { Record, RecordUpdate } from '../../types/record';
import { ProcessedTrack, mergeProcessedTracks } from '../../types/track';

type ImplementedMusicPlatform = MusicPlatform.catalog | MusicPlatform.sound | MusicPlatform.noizd;

const name = 'processTracks';

const processorFunction = (platformId: Partial<ImplementedMusicPlatform>) => async (nfts: ERC721NFT[], clients: Clients) => {
  console.log(`Getting ${platformId} API tracks for ids: ${nfts.map(n => n.id)}`);
  const platformMapper = platformConfig[platformId].mappers;
  if (!platformMapper) {
    throw new Error(`Platform mapper for ${platformId} not found`);
  }

  const trackMapping = platformMapper.mapNFTsToTrackIds(nfts);
  const trackIds = Object.keys(trackMapping);
  const existingTrackIds = await clients.db.recordsExist(Table.processedTracks, trackIds);
  const newTrackIds = trackIds.filter(id => !existingTrackIds.includes(id));
  const { newTracks, joins, errorNFTs, artistProfiles } = await platformMapper.createTracks(newTrackIds, trackMapping, clients);
  const artists = artistProfiles.map(profile => mapArtist(profile));

  const { oldIds, mergedProcessedTracks } = await mergeProcessedTracks(newTracks, clients.db, true);

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
