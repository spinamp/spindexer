export enum MusicPlatform {
  sound = "sound",
  zora = "zora",
  noizd = "noizd",
  other = "other"
}

export const platformConfig = {
  sound: {
    metadataURLQuery: 'tokenURI',
  },
  zora: {
    metadataURLQuery: 'tokenMetadataURI',
  },
  noizd: {
    metadataURLQuery: 'tokenURI',
  },
  other: {
    metadataURLQuery: 'tokenURI',
  }
}
