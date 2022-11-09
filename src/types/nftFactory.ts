import { ValidContractNFTCallFunction } from '../clients/evm';

import { formatAddress } from './address';
import { ChainId } from './chain';
import { NFTContractTypeName, NFTContractType } from './nft';

type NftFactoryTypes = {
  [type in NFTContractTypeName]?: NFTContractType
}

export const NFTFactoryTypes: NftFactoryTypes = {
  default: {
    contractCalls: [ValidContractNFTCallFunction.tokenURI],
    contractMetadataField: ValidContractNFTCallFunction.tokenURI,
    buildNFTId: buildERC721Id,
  },
  zora: {
    contractCalls: [ValidContractNFTCallFunction.tokenURI, ValidContractNFTCallFunction.tokenMetadataURI],
    contractMetadataField: ValidContractNFTCallFunction.tokenMetadataURI,
    buildNFTId: buildERC721Id,
  }
}

export function buildERC721Id(chainId: ChainId, contractAddress: string, tokenId: bigint): string {
  // don't prefix ethereum and solana nfts to preserve backwards compatability
  let prefix = ''
  if (![ChainId.ethereum, ChainId.solana].includes(chainId)){
    prefix = `${chainId}/`
  }

  return `${prefix}${formatAddress(contractAddress)}/${tokenId.toString()}`;
}
