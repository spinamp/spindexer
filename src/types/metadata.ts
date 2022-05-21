import { extractHashFromURL } from '../clients/ipfs';

import { ERC721NFT } from './erc721nft';
import { ERC721Contract, ERC721ContractTypeName } from './ethereum';

export const getMetadataURL = (nft: ERC721NFT, contractTypeName: ERC721ContractTypeName): (string | null | undefined) => {
  if (contractTypeName === 'zora') {
    return nft.tokenMetadataURI
  } else {
    return nft.tokenURI
  }
}

export const getMetadataIPFSHash = (nft: ERC721NFT, erc721ContractsByAddress: { [key: string]: ERC721Contract }): (string | null | undefined) => {
  const address = nft.contractAddress;
  const contract = erc721ContractsByAddress[address];
  const contractTypeName = contract.contractType;
  const metadataURL = getMetadataURL(nft, contractTypeName);
  if (!metadataURL) {
    return '';
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || '';
}
