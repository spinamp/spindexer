
import { Axios } from 'axios';

import { cleanURL } from '../utils/sanitizers';

import { NFT, NFTContractTypeName } from './nft';

export const getMetadataFromURI = async (uri: string, axios: Axios, timeout: number) => {
  if (uri.startsWith('data:application/json;base64,')) {
    try {
      const base64 = uri.substring(uri.indexOf(',') + 1);
      const data = Buffer.from(base64, 'base64').toString('utf-8')
      const metadata = JSON.parse(data);
      return { data: metadata };
    } catch (e: any){
      return {
        error: e.toString()
      }
    }
  }

  const queryURL = cleanURL(uri);
  try {
    const response = await axios.get(queryURL, { timeout });
    return {
      data: response.data
    }
  } catch (e: any){
    return {
      error: e.toString()
    }
  }

}

export const getMetadataURL = (nft: NFT, contractTypeName?: NFTContractTypeName): (string | null | undefined) => {
  if (contractTypeName === 'zora') {
    return nft.tokenMetadataURI
  } else {
    return nft.tokenURI
  }
}
