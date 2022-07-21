import { Nft } from '@metaplex-foundation/js';

import { Table } from '../../db/db';
import { newNinaContracts } from '../../triggers/nina';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/ethereum';
import { NFT } from '../../types/nft';
import { MusicPlatformType } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';

export const createNinaNfts: Processor = {

  name: 'createNinaNfts',
  trigger: newNinaContracts,
  processorFunction: async (metadataAccounts: Nft[], clients: Clients) => {
    const nfts = metadataAccounts.map((metadataAccount) => {
      const mintAddress = metadataAccount!.mint.toBase58();

      const details: Partial<NFT> = {
        id: mintAddress,
        contractAddress: mintAddress,
        platformId: MusicPlatformType.nina,
        tokenMetadataURI: metadataAccount!.uri,
        tokenURI: metadataAccount!.uri
      }
      return details
    })

    const nftFactories: NftFactory[] = metadataAccounts.map(account => ({
      address: account!.mint.toBase58(),
      contractType: NFTContractTypeName.nina,
      platformId: MusicPlatformType.nina,
      standard: NFTStandard.METAPLEX,
      name: account.metadata.name,
      symbol: account.metadata.symbol
    }));

    await clients.db.insert<Partial<NftFactory>>(Table.erc721Contracts, nftFactories)
    await clients.db.insert<Partial<NFT>>(Table.erc721nfts, nfts)
  },
  initialCursor: undefined
};
