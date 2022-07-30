export type ERC721NFTProcessError = {
  nftId: string;
  processError?: string;
  metadataError?: string;
  numberOfRetries: number;
}