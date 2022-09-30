
import * as MetaplexFoundation from '@metaplex-foundation/js';
import { ConfirmedSignatureInfo } from '@solana/web3.js';

import { Table } from '../../db/db';
import { newCandyMachineNfts } from '../../triggers/newMetaplexNfts';
import { MetaFactory } from '../../types/metaFactory';
import { NFT, NFTContractTypeName, NftFactory, NFTStandard } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';


export const createNftsFromCandyMachine: (metaFactory: MetaFactory) => Processor = (metaFactory) => {

  return {
    name: 'createNftsFromCandyMachine',
    trigger: newCandyMachineNfts(metaFactory),

    processorFunction: async (items: { metadataAccount: MetaplexFoundation.Metadata, mintTx: ConfirmedSignatureInfo }[], clients: Clients) => {

      const nfts = items.map(({ metadataAccount, mintTx }) => {
        const mintAddress = metadataAccount.mintAddress.toBase58();

        const details: Omit<NFT, 'owner' | 'tokenId' | 'standard'> = {
          id: mintAddress,
          contractAddress: mintAddress,
          platformId: metaFactory.platformId,
          tokenMetadataURI: metadataAccount!.uri,
          tokenURI: metadataAccount!.uri,
          approved: true,
          burned: false,
          createdAtTime: new Date(mintTx.blockTime! * 1000),
        }
        return details
      })
    
      const nftFactories: NftFactory[] = items.map(({ metadataAccount }) => ({
        id: metadataAccount.mintAddress.toBase58(),
        contractType: NFTContractTypeName.candyMachine,
        platformId: metaFactory.platformId,
        standard: NFTStandard.METAPLEX,
        name: metadataAccount.name,
        symbol: metadataAccount.symbol,
        autoApprove: true, 
        approved: true, 
        typeMetadata: {
          overrides: {
            artist: {
              artistId: metadataAccount.creators.find(creator => creator.verified === true)!.address.toBase58()
            }
          }
        }
      }));
     
      await clients.db.insert<Partial<NftFactory>>(Table.nftFactories, nftFactories)
      await clients.db.insert<Partial<NFT>>(Table.nfts, nfts)
    
    },
    initialCursor: undefined
  }
};
