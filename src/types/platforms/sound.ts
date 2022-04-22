import _ from 'lodash';
import slugify from 'slugify';

import { SoundClient } from '../../clients/sound';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { Metadata } from '../metadata';
import { MusicPlatform } from '../platform';
import { ProcessedTrack } from '../track';

const mapTrackID = (metadataId: string): string => {
  const [contractAddress, editionId] = metadataId.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${editionId}`;
};

const mapArtistID = (artistId: string): string => {
  return `ethereum/${formatAddress(artistId)}`;
};

const mapTrack = (item: {
  metadata: Metadata;
  platformTrackResponse: any;
}): ProcessedTrack => ({
  id: mapTrackID(item.metadata.id),
  platformInternalId: item.platformTrackResponse.id,
  title: item.platformTrackResponse.title,
  slug: slugify(`${item.platformTrackResponse.title} ${item.metadata.createdAtTime.getTime()}`).toLowerCase(),
  description: item.platformTrackResponse.description,
  platformId: MusicPlatform.sound,
  lossyAudioURL: item.platformTrackResponse.tracks[0].audio.url,
  createdAtTime: item.metadata.createdAtTime,
  createdAtEthereumBlockNumber: item.metadata.createdAtEthereumBlockNumber,
  lossyArtworkURL: item.platformTrackResponse.coverImage.url,
  websiteUrl:
  item.platformTrackResponse.artist.soundHandle && item.platformTrackResponse.titleSlug
      ? `https://www.sound.xyz/${item.platformTrackResponse.artist.soundHandle}/${item.platformTrackResponse.titleSlug}`
      : 'https://www.sound.xyz',
  artistId: mapArtistID(item.platformTrackResponse.artist.user.publicAddress),
});

export const mapArtistProfile = (platformResponse: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = platformResponse.artist
  return {
    name: artist.name,
    artistId: mapArtistID(artist.user.publicAddress),
    platformInternalId: artist.id,
    platformId: MusicPlatform.sound,
    avatarUrl: artist.user.avatar.url,
    websiteUrl: artist.soundHandle ?
      `https://www.sound.xyz/${artist.soundHandle}`
      : 'https://www.sound.xyz',
    createdAtTime,
    createdAtEthereumBlockNumber
  }
};

const addPlatformTrackData = async (metadatas: Metadata[], client: SoundClient) => {
  const metadataIds = metadatas.map(m=>m.id);
  const platformTracks = await client.getAllMintedReleases();
  const platformTracksWithMetadataId = platformTracks.map(platformTrack => ({
    ...platformTrack,
    metadataId: `${formatAddress(platformTrack?.artist?.contract?.address)}/${platformTrack?.mintInfo?.editionId}`,
  })).filter(platformTrack=> metadataIds.includes(platformTrack.trackId));
  const platformTracksWithAudioPromises = platformTracksWithMetadataId.map(async platformTrack => {
    if(platformTrack.tracks.length > 1) {
      return { isError: true, error: new Error('Sound release with multiple tracks not yet implemented') };
    }
    return {
      ...platformTrack,
      tracks: [{
        ...platformTrack.tracks[0],
        audio: await client.audioFromTrack(platformTrack.tracks[0].id),
      }]
    };
  });
  const platformTracksWithAudio = await Promise.all(platformTracksWithAudioPromises);
  const platformTrackDataByTrackId = _.keyBy(platformTracksWithAudio, 'trackId');
  const platformTrackData: { metadata: Metadata, platformTrackResponse: any }[]
    = metadatas.map(metadata => {
      const platformTrackResponse = platformTrackDataByTrackId[metadata.id] || {
        isError: true,
        error: new Error(`Missing platform track data`)
      }
      return {
        metadata,
        platformTrackResponse
      };
    });
  return platformTrackData;
}

export default {
  addPlatformTrackData,
  mapTrack,
  mapArtistProfile,
}
