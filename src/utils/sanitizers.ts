export const dropLeadingInfo = (str: string) => {
  // remove everything before (and including) the first space
  return str.replace(/^\S+\s+/g, '');
}

export const cleanURL = (urlString: string) => {
  try {
    console.log('clean url', urlString);
    const url = new URL(urlString);
    if (url.protocol === 'ar:') {
      return `${process.env.ARWEAVE_GATEWAY_URL}${urlString.replace(/^ar:\/\//, '')}`;
    }
    return urlString.replace('arweave.rocks', 'arweave.net');
  } catch {
    return urlString.replace('arweave.rocks', 'arweave.net');
  }
};

export const dropTrailingInfo = (str: string) => {
  // remove everything after the ' #' characters
  return str.replace(/\s+#\S+$/g, '');
}
