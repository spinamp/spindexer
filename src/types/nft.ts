import { DBClient } from '../db/db';

import { ERC721ContractTypeName, NFTContractTypes } from './ethereum';
import { MusicPlatform, } from './platform';
import { Record } from './record';

export type NFT = Record & {
  contractAddress: string
  tokenId: BigInt
  platformId: MusicPlatform
  metadataId: string | null
}

export const getNFTContractCalls = (nft: NFT, contractTypeName: ERC721ContractTypeName) => {
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
