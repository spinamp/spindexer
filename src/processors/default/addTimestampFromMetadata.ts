

import { Table } from '../../db/db';
import { missingCreatedAtTimeWithMetadataDate } from '../../triggers/nina';
import { ERC721NFT } from '../../types/erc721nft';
import { Clients, Processor } from '../../types/processor';

export const addTimestampFromMetadata: Processor = {
  
  name: 'addTimestampFromMetadata',
  trigger: missingCreatedAtTimeWithMetadataDate,
  processorFunction: async (nfts: ERC721NFT[], clients: Clients) => {

    const updatedNfts: ERC721NFT[] = nfts.map(nft => {
      return {
        ...nft,
        createdAtTime: new Date(nft.metadata.properties.date)
      }
    })

    await clients.db.upsert<ERC721NFT>(Table.erc721nfts, updatedNfts);
  },
  initialCursor: undefined
};
