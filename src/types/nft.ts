import { DBClient } from '../db/db';

import { CONTRACT_TYPES_BY_ADDRESS, NFTContractTypes } from './ethereum';
import { MusicPlatform, platformConfig } from './platform';
import { Record } from './record';

export type NFT = Record & {
  contractAddress: string
  tokenId: BigInt
  platformId: MusicPlatform
  metadataId: string
}

export const getNFTContractCalls = (nft: NFT) => {
  const contractTypeName = (CONTRACT_TYPES_BY_ADDRESS as any)[nft.contractAddress.toLowerCase()] || 'default';
  const contractType = NFTContractTypes[contractTypeName];
  return contractType.contractCalls.map(call => {
    return {
      contractAddress: nft.contractAddress,
      callFunction: call,
      callInput: nft.tokenId.toString(),
    };
  });
};

// This code checks each record. A more efficient version could probably just
// do a bulk query to check all at once. With that improvement, would also then
// be better to make this function pure.
export const filterNewMetadatas = async (nfts: NFT[], dbClient: DBClient) => {
  let newMetadatas = [];
  let newMetadataIds: any = {};
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (!nft || !nft.metadataId) {
      console.error({ nft });
      throw new Error('Error processing NFT');
    }
    const isExistingMetadata = (await dbClient.recordExists('metadatas', nft.metadataId)) || newMetadataIds[nft.metadataId];
    if (!isExistingMetadata) {
      newMetadataIds[nft.metadataId] = true;
      newMetadatas.push(nft);
    }
  }
  return newMetadatas;
}
