export type NFTProcessError = {
  nftId: string;
  processError?: string;
  processErrorCode?: number;
  metadataError?: string;
  numberOfRetries?: number;
  lastRetry?: Date;
}
