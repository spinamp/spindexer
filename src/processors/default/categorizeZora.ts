import { Table } from '../../db/db';
import { zoraNFTs } from '../../triggers/zora';
import { NFT } from '../../types/nft';
import { MusicPlatformType } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';
import { getZoraPlatform } from '../../types/zora-contract';

export const categorizeZora: Processor = {
  name: 'categorizeZora',
  trigger: zoraNFTs,
  processorFunction: async (nfts: NFT[], clients: Clients) => {
    console.log(`Processing updates for zora nfts with ids: ${nfts.map(n => n.id)}`);
    const nftUpdates = nfts.map((n: NFT) => {
      const platformId = getZoraPlatform(n);
      const approved = platformId === MusicPlatformType.catalog; // all zora nfts are not approved by default, but catalog is approved
      const update = {
        id: n.id,
        platformId,
        approved
      }

      return update
    });
    await clients.db.update(Table.nfts, nftUpdates);
    console.log('Updated');
  },
  initialCursor: undefined
};
