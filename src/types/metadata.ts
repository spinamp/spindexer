import { extractHashFromURL } from '../clients/ipfs';

import { NftFactory, NFTContractTypeName } from './ethereum';
import { NFT } from './nft';

export const getMetadataURL = (nft: NFT, contractTypeName?: NFTContractTypeName): (string | null | undefined) => {
  if (contractTypeName === 'zora') {
    return nft.tokenMetadataURI
  } else {
    return nft.tokenURI
  }
}

export const getMetadataIPFSHash = (nft: NFT, erc721ContractsByAddress: { [key: string]: NftFactory }): (string | null | undefined) => {
  const address = nft.contractAddress;
  const contract = erc721ContractsByAddress[address];
  const contractTypeName = contract?.contractType;
  const metadataURL = getMetadataURL(nft, contractTypeName);
  if (!metadataURL) {
    return '';
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || '';
}
