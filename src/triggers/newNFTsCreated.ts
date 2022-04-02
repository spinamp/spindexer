import { Clients } from '../types/processor';
import { Cursor, Trigger } from '../types/trigger';

export const newNFTsCreated: Trigger<Clients, Cursor> = async (clients: Clients, lastProcessedDBBlock: Cursor) => {
  const latestNFT = await clients.subgraph.getLatestNFT();
  const lastProcessedSubGraphBlock = parseInt(latestNFT.createdAtBlockNumber);

  if (lastProcessedSubGraphBlock === lastProcessedDBBlock) {
    return [];
  }

  const newNFTs = await clients.subgraph.getNFTsFrom(lastProcessedDBBlock + 1);
  return newNFTs;
};
