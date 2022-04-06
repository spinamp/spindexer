import slugify from 'slugify';
import { MusicPlatform } from '../platform';
import { ProcessedTrack, Track } from '../track';
import { toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';
import { formatAddress } from '../address';
import { Artist, ArtistProfile } from '../artist';

export const recoverCatalogAddress = (body: any, signature: string) => {
  const bodyString = JSON.stringify(body);
  const bodyHex = (toUtf8Bytes(bodyString));
  const recovered = verifyMessage(bodyHex, signature).toLowerCase();
  return recovered;
};

export const verifyCatalogTrack = (track: Track) => {
  const CATALOG_ETHEREUM_ADDRESS = '0xc236541380fc0C2C05c2F2c6c52a21ED57c37952'.toLowerCase();
  if (!track.metadata) {
    throw new Error('Track metadata missing')
  }
  if (!track.metadata.origin) {
    return false;
  }
  const signature = track.metadata.origin.signature;
  const body = track.metadata.body;
  return signature && body && recoverCatalogAddress(body, signature) === CATALOG_ETHEREUM_ADDRESS;
}

export const getZoraPlatform = (track: Track) => {
  if (track.platform !== MusicPlatform.zora) {
    throw new Error('Bad track platform being processed')
  }
  if (verifyCatalogTrack(track)) {
    return MusicPlatform.catalog;
  } else {
    return MusicPlatform.zoraRaw
  }
}

export const getTokenIdFromTrack = (track: Track) => {
  return track.id.split('/')[1];

}
export const mapCatalogTrackID = (trackId: string): string => {
  const [contractAddress, nftId] = trackId.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
};

export const mapCatalogArtistID = (artistId: string): string => {
  return `ethereum/${formatAddress(artistId)}`;
};

export const mapCatalogTrack = (trackItem: {
  tokenId: string;
  track: Track;
  catalogTrackResponse?: any;
}): ProcessedTrack => ({
  id: mapCatalogTrackID(trackItem.track.id),
  platformId: trackItem.catalogTrackResponse.id,
  title: trackItem.catalogTrackResponse.title,
  platform: MusicPlatform.catalog,
  lossyAudioIPFSHash: trackItem.catalogTrackResponse.ipfs_hash_lossy_audio,
  lossyAudioURL: `https://catalogworks.b-cdn.net/ipfs/${trackItem.catalogTrackResponse.ipfs_hash_lossy_audio}`,
  createdAtBlockNumber: trackItem.track.createdAtBlockNumber,
  lossyArtworkIPFSHash: `https://catalogworks.b-cdn.net/ipfs/${trackItem.catalogTrackResponse.ipfs_hash_lossy_artwork}`,
  lossyArtworkURL: `https://catalogworks.b-cdn.net/ipfs/${trackItem.catalogTrackResponse.ipfs_hash_lossy_artwork}`,
  websiteUrl:
    trackItem.catalogTrackResponse.artist.handle && trackItem.catalogTrackResponse.short_url
      ? `https://beta.catalog.works/${trackItem.catalogTrackResponse.artist.handle}/${trackItem.catalogTrackResponse.short_url}`
      : 'https://beta.catalog.works',
  artistId: mapCatalogArtistID(trackItem.catalogTrackResponse.artist.id),
  artist: { id: trackItem.catalogTrackResponse.artist.id, name: trackItem.catalogTrackResponse.artist.name }
});

export const mapCatalogArtistProfile = (artistItem: any, createdAtBlockNumber: string): ArtistProfile => {
  return {
    name: artistItem.name,
    artistId: mapCatalogArtistID(artistItem.id),
    platformId: artistItem.id,
    platform: MusicPlatform.catalog,
    avatarUrl: artistItem.picture_uri,
    websiteUrl: artistItem.handle
      ? `https://beta.catalog.works/${artistItem.handle}`
      : 'https://beta.catalog.works',
    createdAtBlockNumber,
  }
};

export const mapCatalogArtist = (artistProfile: ArtistProfile): Artist => {
  return {
    name: artistProfile.name,
    slug: slugify(`${artistProfile.name} ${artistProfile.createdAtBlockNumber}`).toLowerCase(),
    id: artistProfile.artistId,
    profiles: {
      catalog: artistProfile
    },
    createdAtBlockNumber: artistProfile.createdAtBlockNumber,
  }
};
