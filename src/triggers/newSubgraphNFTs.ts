import { Clients } from '../types/processor';
import { Cursor, Trigger } from '../types/trigger';

export const newSubgraphSoundNFTs: Trigger<Cursor> = async (clients: Clients, cursor: string) => {
  const latestNFT = await clients.subgraph.getLatestNFT();
  const lastProcessedTimestamp = latestNFT.createdAtTimestamp;

  if (lastProcessedTimestamp === cursor) {
    return [];
  }

  const nextTimestamp = BigInt(cursor) + BigInt(1);
  const newNFTs = await clients.subgraph.getSoundNFTsFrom(nextTimestamp.toString());
  return newNFTs;
};
