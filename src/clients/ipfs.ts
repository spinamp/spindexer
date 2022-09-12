import { IPFS } from 'ipfs-core-types';
import { create, urlSource as libUrlSource } from 'ipfs-http-client';

export type IPFSClient = {
  getHTTPURL: (ipfsURL: string) => string;
  client: IPFS;
}

// replaces any problematic source urls
export const urlSource = (url: string) => {
  const robustUrl = url.replace('arweave.rocks', 'arweave.net');
  return libUrlSource(robustUrl);
}

export const isIPFSProtocol = (urlString: string) => {
  if (!urlString) {
    return false;
  }
  const url = new URL(urlString);
  return url.protocol === 'ipfs:';
};

export const extractBaseCIDFromHash = (hash: string) => {
  return hash.split('/')[0];
}

export const extractHashFromURL = (urlString: string) => {
  try {
    const url = new URL(urlString);
    if (url.protocol === 'ipfs:') {
      return `${url.host}${url.pathname}`;
    }
    if (url.pathname.startsWith('/ipfs/')) {
      return url.pathname.slice(url.pathname.lastIndexOf('/ipfs/') + 6);
    }
    if (url.host.includes('.ipfs.')) {
      return url.host.split('.ipfs.')[0];
    }
    return null;
  } catch {
    if (urlString.startsWith('Qm')) {
      return urlString;
    }
    if (urlString.startsWith('bafy')) {
      return urlString;
    }
    return null;
  }
}

const init = async () => {
  return {
    getHTTPURL: (ipfsHash: string) => {
      return `${process.env.IPFS_ENDPOINT}${ipfsHash}`;
    },
    client: create({
      url: process.env.IPFS_NODE_HTTP_API
    })
  }
}

export default {
  init
};
