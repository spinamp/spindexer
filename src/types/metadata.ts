
import { NFT, NFTContractTypeName } from './nft';

export const getMetadataURL = (nft: NFT, contractTypeName?: NFTContractTypeName): (string | null | undefined) => {
  if (contractTypeName === 'zora') {
    return nft.tokenMetadataURI
  } else {
    return nft.tokenURI
  }
}
