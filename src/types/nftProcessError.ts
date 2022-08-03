export type NFTProcessError = {
  nftId: string;
  processError?: string;
  metadataError?: string;
  numberOfRetries?: number;
  lastRetry?: Date;
}
