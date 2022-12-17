export class IPFSUploadError extends Error {
  readonly name = 'IPFSUploadError';
  readonly url: string;

  constructor(message: string, url: string) {
    super(getErrorMessage(message, url));

    // 👇️ because we are extending a built-in class
    Object.setPrototypeOf(this, IPFSUploadError.prototype);

    this.url = url;
  }
}

function getErrorMessage(url: string, message: string) {
  return `Error when uploading file to IPFS at url "${url}": ${message}`;
}
