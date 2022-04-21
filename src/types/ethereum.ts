import { ValidContractCallFunction } from "../clients/ethereum"
import { formatAddress } from "./address"
import { MusicPlatform } from "./platform"

export const ETHEREUM_NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export type ERC721Contract = {
  address: string,
  platform: MusicPlatform,
  startingBlock: string,
  buildTrackId: (contractAddress: string, tokenId: BigInt) => string,
  contractType: keyof NFTContractTypes,
}

type NFTContractTypes = {
  [type:string] : {
    contractCalls: ValidContractCallFunction[],
    contractMetadataField: ValidContractCallFunction,
    }
}

export const NFTContractTypes:NFTContractTypes = {
  default: {
    contractCalls: [ValidContractCallFunction.tokenURI],
    contractMetadataField: ValidContractCallFunction.tokenURI,
  },
  zora: {
    contractCalls: [ValidContractCallFunction.tokenURI, ValidContractCallFunction.tokenMetadataURI],
    contractMetadataField: ValidContractCallFunction.tokenMetadataURI,
  }
}

export const NewCatalogContract:ERC721Contract = {
  address: '0x0bC2A24ce568DAd89691116d5B34DEB6C203F342',
  platform: MusicPlatform.catalog,
  startingBlock: '14566825',
  buildTrackId: (contractAddress: string, tokenId: BigInt): string => {
    return `${formatAddress(contractAddress)}/${tokenId.toString()}`;
  },
  contractType: 'default',
};

export const CONTRACT_TYPES_BY_ADDRESS = {
  '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7': 'zora'
};

export function buildERC721Id(contractAddress: string, tokenId: BigInt): string {
  return `${contractAddress.toLowerCase()}/${tokenId.toString()}`;
}
