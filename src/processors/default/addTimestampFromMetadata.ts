

import { Table } from '../../db/db';
import { missingCreatedAtTimeWithMetadataDate } from '../../triggers/nina';
import { NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';

export const addTimestampFromMetadata: Processor = {
  
  name: 'addTimestampFromMetadata',
  trigger: missingCreatedAtTimeWithMetadataDate,
  processorFunction: async (nfts: NFT[], clients: Clients) => {

    const updatedNfts: NFT[] = nfts.map(nft => {
      return {
        ...nft,
        createdAtTime: new Date(nft.metadata.properties.date)
      }
    })

    await clients.db.upsert<NFT>(Table.erc721nfts, updatedNfts);
  },
  initialCursor: undefined
};
