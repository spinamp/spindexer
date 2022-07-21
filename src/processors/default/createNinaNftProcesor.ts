import { Nft } from '@metaplex-foundation/js';

import { Table } from '../../db/db';
import { newNinaContracts } from '../../triggers/nina';
import { ERC721NFT } from '../../types/erc721nft';
import { MusicPlatformType } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';

export const createNinaNfts: Processor = {

  name: 'createNinaNfts',
  trigger: newNinaContracts,
  processorFunction: async (metadataAccounts: Nft[], clients: Clients) => {
    const nfts = metadataAccounts.map((metadataAccount) => {
      const mintAddress = metadataAccount!.mint.toBase58();

      const details: Partial<ERC721NFT> = {
        id: mintAddress,
        contractAddress: mintAddress,
        platformId: MusicPlatformType.nina,
        tokenMetadataURI: metadataAccount!.uri,
        tokenURI: metadataAccount!.uri
      }
      return details
    })


    await clients.db.insert<Partial<ERC721NFT>>(Table.erc721nfts, nfts)
  },
  initialCursor: undefined
};
