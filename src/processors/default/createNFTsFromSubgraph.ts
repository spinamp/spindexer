import _ from 'lodash';

import { SubgraphNFT } from '../../clients/subgraph';
import { newSubgraphSoundNFTs  } from '../../triggers/newSubgraphNFTs';
import { formatAddress } from '../../types/address';
import { NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';

const name = 'createSoundNFTsFromSubgraph' ;

const processorFunction = async (newBatch: SubgraphNFT[], clients: Clients) => {
  const newNFTs: NFT[] = newBatch.map(subgraphNFT => ({
    id: formatAddress(subgraphNFT.id),
    createdAtEthereumBlockNumber: subgraphNFT.createdAtBlockNumber,
    createdAtTime: new Date(parseInt(subgraphNFT.createdAtTimestamp)),
    contractAddress: subgraphNFT.contractAddress,
    tokenId: subgraphNFT.tokenId,
    platformId: subgraphNFT.platform,
    metadataId: subgraphNFT.track.id
  }));
  const lastCursor = newBatch[newBatch.length - 1].createdAtTimestamp;
  await clients.db.insert('nfts', newNFTs);
  await clients.db.updateProcessor(name, lastCursor);
};

export const createSoundNFTsFromSubgraphProcessor: Processor = {
  name,
  trigger: newSubgraphSoundNFTs,
  processorFunction,
  initialCursor: process.env.GLOBAL_STARTING_TIMESTAMP,
};
