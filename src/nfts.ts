import { DBClient } from './db/db';
import { EthClient } from './clients/ethereum';
import { NFT, getNFTMetadataCall } from './types/nft';

const filterExistingTrackNFTs = async (nfts: NFT[], dbClient: DBClient) => {
  let newTrackNFTs = [];
  let newTrackIds: any = {};
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (!nft || !nft.track) {
      console.log({ nft });
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

export const processTracksFromNFTs = async (nfts: NFT[], dbClient: DBClient, ethClient: EthClient) => {
  const newTrackNFTs = await filterExistingTrackNFTs(nfts, dbClient);
  const metadataCalls = newTrackNFTs.map(nft => getNFTMetadataCall(nft));
  console.log(`Processing bulk call`);
  const metadataURIs = await ethClient.call(metadataCalls)
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
