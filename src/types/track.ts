import { Artist } from "./artist";
import { MusicPlatform } from "./platform"

export type SubgraphTrack = {
  id: string
}

export type ProcessedTrack {
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
  tokenMetadataURI?: string
  metadataIPFSHash?: string
  createdAtBlockNumber?: string
  metadata: any
  platformMetadata?: any
  metadataError: string
}
