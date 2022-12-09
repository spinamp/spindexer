export class IPFSUploadError extends Error {
  readonly url: string;

  constructor(message: string, url: string) {
    super(message);

    // 👇️ because we are extending a built-in class
    Object.setPrototypeOf(this, IPFSUploadError.prototype);

    this.url = url;
  }

  getErrorMessage() {
    return 'Error when uploading file to IPFS: ' + this.message;
  }
}
