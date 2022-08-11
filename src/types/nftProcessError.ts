export type NFTProcessError = {
  nftId: string;
  processError?: string;
  metadataError?: string;
  ipfsMediaError?: string;
  numberOfRetries?: number;
  lastRetry?: Date;
}
