import { DBClient } from '../db/db';
import { SubgraphClient } from '../clients/subgraph';

export const newNFTsCreated = async (dbClient: DBClient, subgraphClient: SubgraphClient, lastProcessedDBBlock: number) => {
  const latestNFT = await subgraphClient.getLatestNFT();
  const lastProcessedSubGraphBlock = parseInt(latestNFT.createdAtBlockNumber);

  if (lastProcessedSubGraphBlock === lastProcessedDBBlock) {
    return [];
  }

  const newNFTs = await subgraphClient.getNFTsFrom(lastProcessedDBBlock + 1);
  if (newNFTs.length === 0) {
    return [];
  }
  return newNFTs;
};
