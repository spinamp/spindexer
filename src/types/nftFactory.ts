import { ValidContractNFTCallFunction } from '../clients/evm';

import { formatAddress } from './address';
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

export function buildERC721Id(contractAddress: string, tokenId: bigint): string {
  return `${formatAddress(contractAddress)}/${tokenId.toString()}`;
}
