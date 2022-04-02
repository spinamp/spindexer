import { DBClient } from '../db/db';
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

// This code checks each record. A more efficient version could probably just
// do a bulk query to check all at once. With that improvement, would also then
// be better to make this function pure.
export const filterExistingTrackNFTs = async (nfts: NFT[], dbClient: DBClient) => {
  let newTrackNFTs = [];
  let newTrackIds: any = {};
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (!nft || !nft.track) {
      console.error({ nft });
      throw new Error('Error processing NFT');
    }
    const isExistingTrack = (await dbClient.recordExists('tracks', nft.track.id)) || newTrackIds[nft.track.id];
    if (!isExistingTrack) {
      newTrackIds[nft.track.id] = true;
      newTrackNFTs.push(nft);
    }
  }
  return newTrackNFTs;
}
