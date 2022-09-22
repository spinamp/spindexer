export const dropLeadingInfo = (str: string) => {
  // remove everything before (and including) the first space
  return str.replace(/^\S+\s+/g, '');
}

export const cleanURL = (urlString: string) => {
  try {
    const url = new URL(urlString);
    if (url.protocol === 'ar:') {
      return `${process.env.ARWEAVE_GATEWAY}${url.pathname.replace(/^\/\//, '')}`;
    }
    return urlString.replace('arweave.rocks', 'arweave.net');
  } catch {
    return urlString.replace('arweave.rocks', 'arweave.net');
  }
};
