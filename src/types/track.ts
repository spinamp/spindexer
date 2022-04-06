import { ValidContractCallFunction } from "../clients/ethereum";
import { extractHashFromURL } from "../clients/ipfs";
import { Artist } from "./artist";
import { MusicPlatform, platformConfig } from "./platform"

export type SubgraphTrack = {
  id: string
}

export type ProcessedTrack = {
  id: string;
  platformId: string;
  title: string;
  platform: MusicPlatform;
  lossyAudioIPFSHash?: string;
  lossyAudioURL: string;
  description?: string;
  artwork?: string;
  createdAtBlockNumber: string;
  lossyArtworkIPFSHash?: string;
  lossyArtworkURL: string;
  websiteUrl?: string;
  artistId: string;
  artist: { id: string, name: string };
}

export type Track = {
  id: string,
  platform: MusicPlatform,
  metadataIPFSHash?: string
  createdAtBlockNumber: string
  [ValidContractCallFunction.tokenURI]?: string
  [ValidContractCallFunction.tokenMetadataURI]?: string
  metadata?: any
  metadataError?: string
  processed?: true
}

export const getMetadataURL = (track: Track): (string | null | undefined) => {
  const metadataField = platformConfig[track.platform].contractMetadataField;
  const metadataURL = track[metadataField];
  return metadataURL;
}

export const getMetadataIPFSHash = (track: Track): (string | null | undefined) => {
  const metadataURL = getMetadataURL(track);
  if (!metadataURL) {
    return null;
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || null;
}
