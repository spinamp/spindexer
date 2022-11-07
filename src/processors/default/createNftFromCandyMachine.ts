
import * as MetaplexFoundation from '@metaplex-foundation/js';
import { ConfirmedSignatureInfo } from '@solana/web3.js';

import { Table } from '../../db/db';
import { newCandyMachineNfts } from '../../triggers/newCandyMachineNfts';
import { MetaFactory, MetaFactoryTypes } from '../../types/metaFactory';
import { NFT, NftFactory } from '../../types/nft';
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
          approved: metaFactory.autoApprove,
          burned: false,
          createdAtTime: new Date(mintTx.blockTime! * 1000),
          chainId: metaFactory.chainId
        }
        return details
      })
      
      const creationMetadataToNftFactory = MetaFactoryTypes[metaFactory.contractType]?.creationMetadataToNftFactory;

      if (!creationMetadataToNftFactory){
        throw `no creationMetadataToNftFactory specified for ${metaFactory.contractType}`
      }

      const nftFactories: NftFactory[] = items.map(({ metadataAccount }) => {
        return creationMetadataToNftFactory({ metadataAccount }, metaFactory.autoApprove, metaFactory)
      });
    
      await clients.db.insert<Partial<NftFactory>>(Table.nftFactories, nftFactories)
      await clients.db.insert<Partial<NFT>>(Table.nfts, nfts)
    
    },
    initialCursor: undefined
  }
};
