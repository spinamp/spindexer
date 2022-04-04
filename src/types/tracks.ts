import { MusicPlatform } from "./platforms"

export type SubgraphTrack = {
  id: string
}

export type Track = {
  id: string,
  platform: MusicPlatform,
  tokenMetadataURI?: string
  metadataIPFSHash?: string
  createdAtBlockNumber?: string
  metadata: any
  metadataError: string
}
