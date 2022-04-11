import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const newNFTsCreated: Trigger<Clients, bigint> = async (clients: Clients, cursor: bigint) => {
  const latestNFT = await clients.subgraph.getLatestNFT();
  const lastProcessedTimestamp = BigInt(latestNFT.createdAtTimestamp);

  if (lastProcessedTimestamp === cursor) {
    return [];
  }

  const newNFTs = await clients.subgraph.getNFTsFrom(cursor + BigInt(1));
  return newNFTs;
};
