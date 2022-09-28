export type NFTProcessError = {
  nftId: string;
  processError?: string;
  processErrorName?: string;
  metadataError?: string;
  numberOfRetries?: number;
  lastRetry?: Date;
}
