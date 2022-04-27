import { extractHashFromURL } from '../clients/ipfs';

import { ERC721NFT } from './erc721nft';

export const getMetadataURL = (nft: ERC721NFT): (string | null | undefined) => {
  if(nft.platformId === 'zora') {
    return nft.tokenMetadataURI
  } else {
    return nft.tokenURI
  };
}

export const getMetadataIPFSHash = (nft: ERC721NFT): (string | null | undefined) => {
  const metadataURL = getMetadataURL(nft);
  if (!metadataURL) {
    return '';
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || '';
}
