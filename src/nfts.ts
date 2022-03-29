import { MusicPlatform, platformConfig } from './platforms';
import { Track } from './tracks';

export type NFT = {
  id: string
  createdAtBlockNumber: string
  contractAddress: string
  platform: MusicPlatform
}

const getNFTMetadataCalls = (nfts: NFT[]) => {
  return nfts.map(nft => {
    return {
      contractAddress: nft.contractAddress,
      callAddress: nft.id,
      callFunction: platformConfig[nft.platform],
    };
  });
};

export const processNFTs = (nfts: NFT[]) => {
  nfts.map(nft => {
    console.log(`Processing nft ${nft.id}`);
  });
  return nfts;
};
