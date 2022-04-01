import { MusicPlatform, platformConfig } from './platforms';
import { SubgraphTrack } from './tracks';

export type NFT = {
  id: string
  createdAtBlockNumber: string
  contractAddress: string
  tokenId: BigInt
  platform: MusicPlatform
  track: SubgraphTrack
}

export const getNFTMetadataCall = (nft: NFT) => {
  return {
    contractAddress: nft.contractAddress,
    callFunction: platformConfig[nft.platform].metadataURLQuery,
    callInput: nft.tokenId.toString(),
  };
};
