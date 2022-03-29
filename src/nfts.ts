import { MusicPlatform, platformConfig } from './platforms';
import { SubgraphTrack } from './tracks';
import { DBClient } from './db';

export type NFT = {
  id: string
  createdAtBlockNumber: string
  contractAddress: string
  tokenId: BigInt
  platform: MusicPlatform
  track: SubgraphTrack
}

const getNFTMetadataCall = (nft: NFT) => {
  return {
    contractAddress: nft.contractAddress,
    tokenId: nft.tokenId,
    callFunction: platformConfig[nft.platform].metadataURLQuery,
  };
};

const filterExistingTrackNFTs = async (nfts: NFT[], dbClient: DBClient) => {
  let newTrackNFTs = [];
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (!nft || !nft.track) {
      console.log({ nft });
      throw new Error('Error processing NFT');
    }
    const isExistingTrack = await dbClient.trackExists(nft.track.id)
    if (!isExistingTrack) {
      newTrackNFTs.push(nft);
    }
  }
  return newTrackNFTs;
}

export const processTracksFromNFTs = async (nfts: NFT[], dbClient: DBClient) => {
  const newTrackNFTs = await filterExistingTrackNFTs(nfts, dbClient);
  const newTracks = newTrackNFTs.map(nft => {
    console.log(`Processing nft for track ${nft.track.id}`);
    return {
      record: {
        id: nft.track.id
      },
      meta: getNFTMetadataCall(nft)
    }
  });
  // todo: do bulk metadata call to get all metadata urls and add to track record
  // todo: do metadata url calls to get all metadata and add to track record
  // todo: postfilter/zora only music&catalog filter/extra noizd calls/extra centralized calls for optimized media
  console.log({
    l1: nfts.length,
    l2: newTracks.length
  })
  return newTracks.map(track => track.record);
};
