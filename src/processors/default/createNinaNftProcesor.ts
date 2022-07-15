import { Metaplex, convertToPublickKey } from '@metaplex-foundation/js';
import { web3 } from '@project-serum/anchor';

import { Table } from '../../db/db';
import { ninaContractsWithoutNfts } from '../../triggers/nina';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';

export const createNinaNfts: Processor = {

  name: 'createNinaNfts',
  trigger: ninaContractsWithoutNfts,
  processorFunction: async (contracts: ERC721Contract[], clients: Clients) => {
    const connection = new web3.Connection('https://ssc-dao.genesysgo.net/');

    const metaplex = new Metaplex(connection);
    const metadataAccounts = (await metaplex.nfts().findAllByMintList(contracts.map(contract => convertToPublickKey(contract.address))))
      .filter(account => account?.uri)

    const nfts = (await Promise.all(metadataAccounts.map(async (metadataAccount) => {

      const mintAddress = metadataAccount!.mint.toBase58();


      const details: Partial<ERC721NFT> = {
        id: mintAddress,
        contractAddress: mintAddress,
        platformId: contracts.find(contract => contract.address === mintAddress)!.platformId,
        tokenMetadataURI: metadataAccount!.uri,
        tokenURI: metadataAccount!.uri
      }
      return details
    })))



    await clients.db.insert<Partial<ERC721NFT>>(Table.erc721nfts, nfts)
  },
  initialCursor: undefined
};
