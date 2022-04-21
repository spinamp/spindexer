import { ValidContractCallFunction } from '../clients/ethereum';
import { extractHashFromURL } from '../clients/ipfs';

import { MusicPlatform } from './platform'
import { Record } from './record'

export type Metadata = Record & {
  platformId: MusicPlatform,
  metadataIPFSHash?: string
  [ValidContractCallFunction.tokenURI]?: string
  [ValidContractCallFunction.tokenMetadataURI]?: string
  metadata?: any
  metadataError?: string
  mimeType?: string
  processed?: true
  processError?: true
}

export const getMetadataURL = (metadata: Metadata): (string | null | undefined) => {
  if(metadata.platformId === 'zora') {
    return metadata.tokenMetadataURI
  } else {
    return metadata.tokenURI
  };
}

export const getMetadataIPFSHash = (metadata: Metadata): (string | null | undefined) => {
  const metadataURL = getMetadataURL(metadata);
  if (!metadataURL) {
    return '';
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || '';
}
