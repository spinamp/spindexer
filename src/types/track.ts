import { ValidContractCallFunction } from "../clients/ethereum";
import { extractHashFromURL } from "../clients/ipfs";
import { Artist } from "./artist";
import { MusicPlatform, platformConfig } from "./platform"

export type SubgraphTrack = {
  id: string
}

export type ProcessedTrack = {
  id: string;
  originalId: string;
  title: string;
  platform: MusicPlatform;
  url: string;
  description?: string;
  artwork?: string;
  createdAt?: string;
  websiteUrl?: string;
  artistId: string;
  artist: Artist;
}

export type Track = {
  id: string,
  platform: MusicPlatform,
  metadataIPFSHash?: string
  createdAtBlockNumber?: string
  [ValidContractCallFunction.tokenURI]?: string
  [ValidContractCallFunction.tokenMetadataURI]?: string
  metadata?: any
  metadataError?: string
  platformMetadata?: any
}

export const getMetadataURL = (track: Track): (string | null | undefined) => {
  const metadataField = platformConfig[track.platform].contractMetadataField;
  const metadataURL = track[metadataField];
  return metadataURL;
}

export const getMetadataIPFSHash = (track: Track): (string | null | undefined) => {
  const metadataURL = getMetadataURL(track);
  if (!metadataURL) {
    return undefined;
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || null;
}
