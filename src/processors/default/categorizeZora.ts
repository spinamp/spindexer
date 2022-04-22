import { zoraMetadatas } from '../../triggers/zora';
import { Metadata } from '../../types/metadata';
import { getZoraPlatform } from '../../types/platforms/catalog';
import { Clients, Processor } from '../../types/processor';

export const categorizeZora: Processor = {
  name: 'categorizeZora',
  trigger: zoraMetadatas,
  processorFunction: async (metadatas: Metadata[], clients: Clients) => {
    console.log(`Processing updates for metadatas with platforms: ${metadatas.map(m => m.platformId)}`);
    const metadataUpdates = metadatas.map((m: Metadata) => ({
      id: m.id,
      platformId: getZoraPlatform(m),
    }));
    await clients.db.update('metadatas', metadataUpdates);
    console.log('Updated');
  },
  initialCursor: undefined
};
