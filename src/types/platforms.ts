import { toUtf8Bytes, hexlify, recoverAddress, verifyMessage } from "ethers/lib/utils";
import { Track } from "./tracks"

export enum MusicPlatform {
  sound = "sound",
  zora = "zora",
  noizd = "noizd",
  catalog = "catalog",
  zoraRaw = "zoraRaw",
  other = "other"
}

export const platformConfig = {
  sound: {
    metadataURLQuery: 'tokenURI',
  },
  zora: {
    metadataURLQuery: 'tokenMetadataURI',
  },
  catalog: {
    metadataURLQuery: 'tokenMetadataURI',
  },
  zoraRaw: {
    metadataURLQuery: 'tokenMetadataURI',
  },
  noizd: {
    metadataURLQuery: 'tokenURI',
  },
  other: {
    metadataURLQuery: 'tokenURI',
  }
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


export const recoverCatalogAddress = (body: any, signature: string) => {
  const bodyString = JSON.stringify(body);
  const bodyHex = (toUtf8Bytes(bodyString));
  const recovered = verifyMessage(bodyHex, signature).toLowerCase();
  return recovered;
};

export const verifyCatalogTrack = (track: Track) => {
  const CATALOG_ETHEREUM_ADDRESS = '0xc236541380fc0C2C05c2F2c6c52a21ED57c37952'.toLowerCase();
  const signature = track.metadata.origin?.signature;
  const body = track.metadata.body;
  return signature && body && recoverCatalogAddress(body, signature) === CATALOG_ETHEREUM_ADDRESS;
}
