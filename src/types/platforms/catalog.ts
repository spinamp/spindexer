import { MusicPlatform } from "../platform";
import { Track } from "../track";
import { toUtf8Bytes, verifyMessage } from "ethers/lib/utils";
import { formatAddress } from "../address";

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

// artist: {
//   name: track.artist.name,
//   id: mapCatalogArtistID(track),
//   originalId: track.artist.id,
//   provider: MusicProvider.catalog,
//   avatarUrl: track.artist.picture_uri,
//   websiteUrl: track.artist.handle
//     ? `https://beta.catalog.works/${track.artist.handle}`
//     : 'https://beta.catalog.works',
// },

export const getTokenIdFromTrack = (track: Track) => {
  return track.id.split('/')[1];

}
export const mapCatalogTrackID = (contractAddress: string, nftID: string): string => {
  return `ethereum/${formatAddress(contractAddress)}/${nftID}`;
};

export const mapCatalogArtistID = (catalogArtistID: string): string => {
  return `ethereum/${formatAddress(catalogArtistID)}`;
};

export const transformCatalogTracks = (catalogTrackData: any) => {
  return {
    processedTrack: {
      id: mapCatalogTrackID(catalogTrackData.contract_address, catalogTrackData.nft_id),
      platformMetadata: catalogTrackData
    },
    artistProfile: {
      id: mapCatalogArtistID(catalogTrackData.artist.id),
      //   name: track.artist.name,
      //   originalId: track.artist.id,
      //   provider: MusicProvider.catalog,
      //   avatarUrl: track.artist.picture_uri,
      //   websiteUrl: track.artist.handle
      //     ? `https://beta.catalog.works/${track.artist.handle}`
      //     : 'https://beta.catalog.works',
    },
    artist: {
    }
  }
};

// export const mapCatalogTrack = (track: any): IRawTrack => ({
//   id: mapCatalogTrackID(track),
//   title: track.title,
//   artist: { // this is the artist profile
//     name: track.artist.name,
//     id: mapCatalogArtistID(track),
//     originalId: track.artist.id,
//     provider: MusicProvider.catalog,
//     avatarUrl: track.artist.picture_uri,
//     websiteUrl: track.artist.handle
//       ? `https://beta.catalog.works/${track.artist.handle}`
//       : 'https://beta.catalog.works',
//   },
//   url: `https://catalogworks.b-cdn.net/ipfs/${track.ipfs_hash_lossy_audio}`,
//   createdAt: track.created_at,
//   artwork: `https://catalogworks.b-cdn.net/ipfs/${track.ipfs_hash_lossy_artwork}`,
//   websiteUrl:
//     track.artist.handle && track.short_url
//       ? `https://beta.catalog.works/${track.artist.handle}/${track.short_url}`
//       : 'https://beta.catalog.works',
// });
