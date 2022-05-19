import { Table } from '../../db/db';
import { zoraNFTs } from '../../triggers/zora';
import { ERC721NFT } from '../../types/erc721nft';
import { Clients, Processor } from '../../types/processor';
import { getZoraPlatform } from '../../types/zora-contract';

export const categorizeZora: Processor = {
  name: 'categorizeZora',
  trigger: zoraNFTs,
  processorFunction: async (nfts: ERC721NFT[], clients: Clients) => {
    console.log(`Processing updates for zora nfts with ids: ${nfts.map(n => n.id)}`);
    const nftUpdates = nfts.map((n: ERC721NFT) => ({
      id: n.id,
      platformId: getZoraPlatform(n),
    }));
    await clients.db.update(Table.erc721nfts, nftUpdates);
    console.log('Updated');
  },
  initialCursor: undefined
};
