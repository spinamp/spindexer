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
