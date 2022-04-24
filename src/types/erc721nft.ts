import { DBClient } from '../db/db';

import { ERC721ContractTypeName, NFTContractTypes } from './ethereum';
import { MusicPlatform, } from './platform';
import { Record } from './record';

export type ERC721NFT = Record & {
  contractAddress: string
  tokenId: BigInt
  platformId: MusicPlatform
}

export const getNFTContractCalls = (nft: ERC721NFT, contractTypeName: ERC721ContractTypeName) => {
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
export const filterNewTrackNFTs = async (nfts: ERC721NFT[], dbClient: DBClient) => {
  let newTrackNFTs = [];
  let newTrackIds: any = {};
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    const trackID = getTrackId(nft);
    if (!nft || !trackID) {
      console.error({ nft });
      throw new Error('Error processing NFT');
    }
    const hasExistingTrack = (await dbClient.recordExists('tracks', trackID)) || newTrackIds[trackID];
    if (!hasExistingTrack) {
      newTrackIds[trackID] = true;
      newTrackNFTs.push(nft);
    }
  }
  return newTrackNFTs;
}
function getTrackId(nft: ERC721NFT) {
  throw new Error('Function not implemented.');
  return 'nyi';
}
