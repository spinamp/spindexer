import { MusicPlatform } from '../platform';
import { ProcessedTrack, Track } from '../track';
import { toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { CatalogClient } from '../../clients/catalog';
import _ from 'lodash';
import slugify from 'slugify';

export const recoverCatalogAddress = (body: any, signature: string) => {
  const bodyString = JSON.stringify(body);
  const bodyHex = (toUtf8Bytes(bodyString));
  const recovered = verifyMessage(bodyHex, signature).toLowerCase();
  return recovered;
};

export const verifyCatalogTrack = (track: Track) => {
  const CATALOG_ETHEREUM_ADDRESS = '0xc236541380fc0C2C05c2F2c6c52a21ED57c37952'.toLowerCase();
  if (!track.metadata) {
    throw new Error(`Track metadata missing for track ${track.id}`)
  }
  if (!track.metadata.origin) {
    return false;
  }
  const signature = track.metadata.origin.signature;
  const body = track.metadata.body;
  return signature && body && recoverCatalogAddress(body, signature) === CATALOG_ETHEREUM_ADDRESS;
}

export const getZoraPlatform = (track: Track) => {
  if (track.platformId !== MusicPlatform.zora) {
    throw new Error('Bad track platform being processed')
  }
  if (verifyCatalogTrack(track)) {
    return MusicPlatform.catalog;
  } else {
    return MusicPlatform.zoraRaw
  }
}

const getTokenIdFromTrack = (track: Track) => {
  return track.id.split('/')[1];
}

const mapTrackID = (trackId: string): string => {
  const [contractAddress, nftId] = trackId.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
};

const mapArtistID = (artistId: string): string => {
  return `ethereum/${formatAddress(artistId)}`;
};

const mapTrack = (trackItem: {
  track: Track;
  platformTrackResponse?: any;
}): ProcessedTrack => ({
  id: mapTrackID(trackItem.track.id),
  platformInternalId: trackItem.platformTrackResponse.id,
  title: trackItem.platformTrackResponse.title,
  slug: slugify(`${trackItem.platformTrackResponse.title} ${trackItem.track.createdAtTime.getTime()}`).toLowerCase(),
  description: trackItem.platformTrackResponse.description,
  platformId: MusicPlatform.catalog,
  lossyAudioIPFSHash: trackItem.platformTrackResponse.ipfs_hash_lossy_audio,
  lossyAudioURL: `https://catalogworks.b-cdn.net/ipfs/${trackItem.platformTrackResponse.ipfs_hash_lossy_audio}`,
  createdAtTime: trackItem.track.createdAtTime,
  createdAtEthereumBlockNumber: trackItem.track.createdAtEthereumBlockNumber,
  lossyArtworkIPFSHash: trackItem.platformTrackResponse.ipfs_hash_lossy_artwork,
  lossyArtworkURL: `https://catalogworks.b-cdn.net/ipfs/${trackItem.platformTrackResponse.ipfs_hash_lossy_artwork}`,
  websiteUrl:
    trackItem.platformTrackResponse.artist.handle && trackItem.platformTrackResponse.short_url
      ? `https://beta.catalog.works/${trackItem.platformTrackResponse.artist.handle}/${trackItem.platformTrackResponse.short_url}`
      : 'https://beta.catalog.works',
  artistId: mapArtistID(trackItem.platformTrackResponse.artist.id),
});

export const mapArtistProfile = (platformResponse: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = platformResponse.artist;
  return {
    name: artist.name,
    artistId: mapArtistID(artist.id),
    platformInternalId: artist.id,
    platformId: MusicPlatform.catalog,
    avatarUrl: artist.picture_uri,
    websiteUrl: artist.handle
      ? `https://beta.catalog.works/${artist.handle}`
      : 'https://beta.catalog.works',
    createdAtTime,
    createdAtEthereumBlockNumber
  }
};

const addPlatformTrackData = async (tracks: Track[], client: CatalogClient) => {
  const trackTokenIds = tracks.map(t => getTokenIdFromTrack(t));
  const platformTracks = await client.fetchCatalogTracksByNFT(trackTokenIds);
  const platformTrackDataByTokenId = _.keyBy(platformTracks, 'nft_id');
  const platformTrackData: { track: Track, platformTrackResponse: any }[]
    = tracks.map(track => ({
      track,
      platformTrackResponse: platformTrackDataByTokenId[getTokenIdFromTrack(track)]
    }));
  return platformTrackData;
}

export default {
  addPlatformTrackData,
  mapTrack,
  mapArtistProfile,
}
