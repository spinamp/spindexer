export type ERC721NFTProcessError = {
  erc721nftId: string;
  processError?: string;
  metadataError?: string;
  numberOfRetries: number;
}