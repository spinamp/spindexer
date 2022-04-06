export type IPFSClient = {
  getHTTPURL: (ipfsURL: string) => string;
}

export const isIPFSProtocol = (urlString: string) => {
  if (!urlString) {
    return false;
  }
  const url = new URL(urlString);
  return url.protocol === 'ipfs:';
};

export const extractHashFromURL = (urlString: string) => {
  try {
    const url = new URL(urlString);
    if (url.protocol === 'ipfs:') {
      return url.host;
    }
    if (url.pathname.startsWith('/ipfs/')) {
      return url.pathname.slice(url.pathname.lastIndexOf('/ipfs/') + 6);
    }
    if (url.host.includes('.ipfs.')) {
      return url.host.split('.ipfs.')[0];
    }
    return null;
  } catch {
    return null;
  }
}

const init = async () => {
  return {
    getHTTPURL: (ipfsHash: string) => {
      return `${process.env.IPFS_ENDPOINT}${ipfsHash}`;
    }
  }
}

export default {
  init
};
