export type IPFSFile = {
  url: string;
  cid?: string;
  mimeType?: string;
  error?: string;
  numberOfRetries?: number;
  lastRetry?: Date;
}
