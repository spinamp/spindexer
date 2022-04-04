import { MusicPlatform } from "./platforms"

export type SubgraphTrack = {
  id: string
}

export type Track = {
  id: string,
  platform: MusicPlatform,
  tokenMetadataURI?: string
  metadataIPFSHash?: string
  metadata: any
  metadataError: string
}
