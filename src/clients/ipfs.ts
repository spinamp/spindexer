// eslint-disable-next-line @typescript-eslint/no-var-requires
// const { create, IPFSHTTPClient } = require('ipfs-http-client')

import { IPFS } from 'ipfs-core-types';
import { create } from 'ipfs-http-client';



export type IPFSClient = {
  getHTTPURL: (ipfsURL: string) => string;
  client: IPFS;
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
    return '';
  } catch {
    if (urlString.startsWith('Qm')) {
      return urlString;
    }
    if (urlString.startsWith('bafy')) {
      return urlString;
    }
    return '';
  }
}

const init = async () => {

  const ETH_INFURA_IPFS_ID = process.env.INFURA_IPFS_ID
  const ETH_INFURA_IPFS_SECRET = process.env.INFURA_IPFS_SECRET

  return {
    getHTTPURL: (ipfsHash: string) => {
      return `${process.env.IPFS_ENDPOINT}${ipfsHash}`;
    },
    client: create({ url: 'https://ipfs.infura.io:5001/api/v0', headers: {
      authorization: `Basic ${Buffer.from(
        `${ETH_INFURA_IPFS_ID}:${ETH_INFURA_IPFS_SECRET}`
      ).toString('base64')}`
    } })
  }
}

export default {
  init
};
