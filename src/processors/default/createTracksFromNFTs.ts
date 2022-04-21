import _ from 'lodash';
import { EthClient, ValidContractCallFunction } from '../../clients/ethereum';
import { SubgraphNFT } from '../../clients/subgraph';
import { DBClient } from '../../db/db';
import { newNFTsCreated } from '../../triggers/newNFTsCreated';
import { formatAddress } from '../../types/address';
import { filterNewTrackNFTs, getNFTContractCalls, NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { Track } from '../../types/track';

const name = 'createTracksFromNFTs';

export const createTracksFromNFTs = async (nfts: NFT[], dbClient: DBClient, ethClient: EthClient) => {
  const newTrackNFTs = await filterNewTrackNFTs(nfts, dbClient);
  const contractCalls = newTrackNFTs.map(nft => getNFTContractCalls(nft));
  const flatContractCalls: {
    contractAddress: string;
    callFunction: ValidContractCallFunction;
    callInput: string;
  }[] = [];
  let flatContractCallsIndex = 0;
  const nftIndexToCalls = contractCalls.map((nftCalls) => {
    const callIndexes: number[] = [];
    nftCalls.forEach(call => {
      flatContractCalls.push(call);
      callIndexes.push(flatContractCallsIndex)
      flatContractCallsIndex++;
    });
    return callIndexes;
  });
  const callResults = await ethClient.call(flatContractCalls);
  const newTracks = newTrackNFTs.map((nft, index) => {
    console.info(`Processing nft for track ${nft.trackId}`);
    const track: Track = {
      id: formatAddress(nft.trackId),
      platformId: nft.platformId,
      createdAtTime: nft.createdAtTime,
      createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    };
    const callIndexes = nftIndexToCalls[index];
    callIndexes.forEach(callIndex => {
      const key = flatContractCalls[callIndex].callFunction;
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
    createdAtTime: new Date(parseInt(subgraphNFT.createdAtTimestamp)),
    contractAddress: subgraphNFT.contractAddress,
    tokenId: subgraphNFT.tokenId,
    platformId: subgraphNFT.platform,
    trackId: subgraphNFT.track.id
  }));
  const lastCursor = newSubgraphNFTs[newSubgraphNFTs.length - 1].createdAtTimestamp;
  const newTracks = await createTracksFromNFTs(newNFTs, clients.db, clients.eth);
  await clients.db.insert('tracks', newTracks);
  await clients.db.insert('nfts', newNFTs);
  await clients.db.updateProcessor(name, lastCursor);
};

export const createTracksFromNFTsProcessor: Processor = {
  name,
  trigger: newNFTsCreated,
  processorFunction,
  initialCursor: process.env.GLOBAL_STARTING_TIMESTAMP,
};
