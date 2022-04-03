export type SubgraphTrack = {
  id: string
}

export type Track = {
  id: string,
  tokenMetadataURI?: string
  metadataIPFSHash?: string
  metadata: any
  metadataError: string
}
