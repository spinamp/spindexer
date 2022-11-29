export type IPFSFile = {
  url: string;
  cid?: string;
  mimeType?: string;
  isAudio?: boolean;
  isVideo?: boolean;
  isImage?: boolean;
  error?: string;
  numberOfRetries?: number;
  lastRetry?: Date;
}
