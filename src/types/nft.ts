import { DBClient } from '../db/db';

import { CONTRACT_TYPES_BY_ADDRESS, NFTContractTypes } from './ethereum';
import { MusicPlatform, platformConfig } from './platform';
import { Record } from './record';

export type NFT = Record & {
  contractAddress: string
  tokenId: BigInt
  platformId: MusicPlatform
  trackId: string
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
export const filterNewTrackNFTs = async (nfts: NFT[], dbClient: DBClient) => {
  let newTrackNFTs = [];
  let newTrackIds: any = {};
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (!nft || !nft.trackId) {
      console.error({ nft });
      throw new Error('Error processing NFT');
    }
    const isExistingTrack = (await dbClient.recordExists('tracks', nft.trackId)) || newTrackIds[nft.trackId];
    if (!isExistingTrack) {
      newTrackIds[nft.trackId] = true;
      newTrackNFTs.push(nft);
    }
  }
  return newTrackNFTs;
}
