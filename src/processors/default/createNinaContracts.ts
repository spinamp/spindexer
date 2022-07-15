
import { convertToPublickKey, Metaplex } from '@metaplex-foundation/js';
import { web3 } from '@project-serum/anchor';

import { Table } from '../../db/db';
import { newNinaContracts } from '../../triggers/nina';
import { ERC721Contract, ERC721ContractTypeName } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';

export const createNinaContracts: Processor = {
  
  name: 'createNinaContracts',
  trigger: newNinaContracts,
  processorFunction: async (mintAddresses: string[], clients: Clients) => {
    console.log('create nina contracts processor with addresses', mintAddresses)

    const endpoint = process.env.SOLANA_PROVIDER_ENDPOINT;

    if (!endpoint){
      throw 'No solana endpoint configured'
    }

    const connection = new web3.Connection(endpoint);

    const metaplex = new Metaplex(connection);
    const metadataAccounts = (await metaplex.nfts().findAllByMintList(mintAddresses.map(address => convertToPublickKey(address))))
      .filter(x => x)

    const contracts = await mintAddresses.map((mintAddress) => {
      const metadataAccount = metadataAccounts.find(account => account?.mint.toBase58() === mintAddress);

      const contract: ERC721Contract = {
        address: mintAddress,
        platformId: MusicPlatformType.nina,
        contractType: ERC721ContractTypeName.nina,
        name: metadataAccount?.name,
        symbol: metadataAccount?.symbol
      }
      return contract
    })
    
    await clients.db.insert<ERC721Contract>(Table.erc721Contracts, contracts);
  },
  initialCursor: undefined
};
