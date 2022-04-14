import _ from 'lodash';
import { EthClient, ValidContractCallFunction } from '../../clients/ethereum';
import { SubgraphNFT } from '../../clients/subgraph';
import { DBClient } from '../../db/db';
import { newNFTsCreated } from '../../triggers/newNFTsCreated';
import { formatAddress } from '../../types/address';
import { filterNewTrackNFTs, getNFTMetadataCalls, NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/track';

const name = 'createTracksFromNFTs';

export const createTracksFromNFTs = async (nfts: NFT[], dbClient: DBClient, ethClient: EthClient) => {
  const newTrackNFTs = await filterNewTrackNFTs(nfts, dbClient);
  const metadataCalls = newTrackNFTs.map(nft => getNFTMetadataCalls(nft));
  const flatMetadataCalls: {
    contractAddress: string;
    callFunction: ValidContractCallFunction;
    callInput: string;
  }[] = [];
  let flatMetadataCallsIndex = 0;
  const nftIndexToCalls = metadataCalls.map((nftCalls) => {
    const callIndexes: number[] = [];
    nftCalls.forEach(call => {
      flatMetadataCalls.push(call);
      callIndexes.push(flatMetadataCallsIndex)
      flatMetadataCallsIndex++;
    });
    return callIndexes;
  });
  console.info(`Processing bulk call`);
  const callResults = await ethClient.call(flatMetadataCalls);
  const newTracks = newTrackNFTs.map((nft, index) => {
    console.info(`Processing nft for track ${nft.trackId}`);
    const track: Track = {
      id: formatAddress(nft.trackId),
      platform: nft.platform,
      createdAtTimestamp: nft.createdAtTimestamp,
      createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    };
    const callIndexes = nftIndexToCalls[index];
    callIndexes.forEach(callIndex => {
      const key = flatMetadataCalls[callIndex].callFunction;
      const value = callResults[callIndex];
      track[key] = value as string;
    });
    return track;
  });
  return newTracks;
};

const processorFunction = async (newSubgraphNFTs: SubgraphNFT[], clients: Clients) => {
  const newNFTs: NFT[] = newSubgraphNFTs.map(subgraphNFT => ({
    id: formatAddress(subgraphNFT.id),
    createdAtEthereumBlockNumber: subgraphNFT.createdAtBlockNumber,
    createdAtTimestamp: subgraphNFT.createdAtTimestamp,
    contractAddress: subgraphNFT.contractAddress,
    tokenId: subgraphNFT.tokenId,
    platform: subgraphNFT.platform,
    trackId: subgraphNFT.track.id
  }));
  const lastCursor = newNFTs[newNFTs.length - 1].createdAtTimestamp;
  const newTracks = await createTracksFromNFTs(newNFTs, clients.db, clients.eth);
  await clients.db.insert('nfts', newNFTs);
  await clients.db.insert('tracks', newTracks);
  await clients.db.updateProcessor(name, lastCursor);
};

export const createTracksFromNFTsProcessor: Processor = {
  name,
  trigger: newNFTsCreated,
  processorFunction,
  initialCursor: process.env.GLOBAL_STARTING_TIMESTAMP,
};
