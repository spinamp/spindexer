import { toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';

import { NFT } from './nft';
import { MusicPlatformType } from './platform';

export const ZORA_CONTRACT_ADDRESS = '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7';
// const CATALOG_ETHEREUM_ADDRESS = '0xc236541380fc0C2C05c2F2c6c52a21ED57c37952'.toLowerCase();

const recoverCatalogAddress = (body: any, signature: string) => {
  const bodyString = JSON.stringify(body);
  const bodyHex = (toUtf8Bytes(bodyString));
  const recovered = verifyMessage(bodyHex, signature).toLowerCase();
  return recovered;
};

const verifyCatalogTrack = (nft: NFT) => {
  if (!nft.metadata) {
    throw new Error(`Full metadata missing for record ${nft.id}`)
  }
  if (!nft.metadata.origin) {
    return false;
  }
  const signature = nft.metadata.origin.signature;
  const body = nft.metadata.body;
  return signature && body && body.version === 'catalog-20210202';
  // We should check the signature, but since we're storing the body as jsonb in the DB
  // rather than json, the order of keys is not preserved and so the bytes are shuffled and
  // won't match the signed bytes. So we just check the version above as a heuristic, even though this is insecure.
  // return signature && body && recoverCatalogAddress(body, signature) === CATALOG_ETHEREUM_ADDRESS;
}

export const getZoraPlatform = (nft: NFT) => {
  if (nft.contractAddress !== ZORA_CONTRACT_ADDRESS) {
    throw new Error('Trying to process NFT not from Zora')
  }
  if (verifyCatalogTrack(nft)) {
    return MusicPlatformType.catalog;
  } else {
    return MusicPlatformType.zora
  }
}
