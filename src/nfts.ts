import { MusicPlatform, platformConfig } from './platforms';
import { SubgraphTrack } from './tracks';
import { DBClient } from './db';
import { EthClient } from './ethereum';

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
    callFunction: platformConfig[nft.platform].metadataURLQuery,
    callInput: nft.tokenId.toString(),
  };
};

const filterExistingTrackNFTs = async (nfts: NFT[], dbClient: DBClient) => {
  let newTrackNFTs = [];
  let newTrackIds: any = {};
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (!nft || !nft.track) {
      console.log({ nft });
      throw new Error('Error processing NFT');
    }
    const isExistingTrack = (await dbClient.trackExists(nft.track.id)) || newTrackIds[nft.track.id];
    if (!isExistingTrack) {
      newTrackIds[nft.track.id] = true;
      newTrackNFTs.push(nft);
    }
  }
  return newTrackNFTs;
}

export const processTracksFromNFTs = async (nfts: NFT[], dbClient: DBClient, ethClient: EthClient) => {
  const newTrackNFTs = await filterExistingTrackNFTs(nfts, dbClient);
  const metadataCalls = newTrackNFTs.map(nft => getNFTMetadataCall(nft));
  console.log(`Processing bulk call`);
  const metadataURIs = await ethClient.call(metadataCalls)
  // todo: do bulk metadata call to get all metadata urls and add to track record
  // todo: do metadata url calls to get all metadata and add to track record
  // todo: postfilter/zora only music&catalog filter/extra noizd calls/extra centralized calls for optimized media
  const newTracks = newTrackNFTs.map((nft, index) => {
    console.log(`Processing nft for track ${nft.track.id}`);
    return {
      record: {
        id: nft.track.id,
        tokenMetadataURI: metadataURIs[index],
      }
    }
  });
  return newTracks.map(track => track.record);
};
