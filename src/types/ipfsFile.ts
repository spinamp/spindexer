export type IPFSFile = {
  cid: string;
  mimeType?: string;
  isAudio?: boolean;
  isVideo?: boolean;
  isImage?: boolean;
  error?: string;
  numberOfRetries?: number;
  lastRetry?: Date;
}

export type IPFSFileUrl = {
  url: string;
  cid?: string;
}
