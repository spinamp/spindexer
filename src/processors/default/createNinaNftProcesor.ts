import * as MetaplexFoundation from '@metaplex-foundation/js';
import { web3, ProgramAccount, IdlTypes, Idl } from '@project-serum/anchor';
import { IdlAccountDef } from '@project-serum/anchor/dist/cjs/idl';
import { TypeDef } from '@project-serum/anchor/dist/cjs/program/namespace/types';

import { Table } from '../../db/db';
import { newNinaContracts } from '../../triggers/nina';
import { NFT, NFTContractTypeName, NftFactory, NFTStandard } from '../../types/nft';
import { MusicPlatformType } from '../../types/platform';
import { Clients, Processor } from '../../types/processor';

type Params = {
  metadataAccount: MetaplexFoundation.Nft;
  release: ProgramAccount<TypeDef<IdlAccountDef, IdlTypes<Idl>>>
}

export const createNinaNfts: Processor = {

  name: 'createNinaNfts',
  trigger: newNinaContracts,
  processorFunction: async (items: Params[], clients: Clients) => {
    const nfts = items.map(({ metadataAccount, release }) => {
      const mintAddress = metadataAccount!.mint!.toBase58();

      const details: Partial<NFT> = {
        id: mintAddress,
        contractAddress: mintAddress,
        platformId: MusicPlatformType.nina,
        tokenMetadataURI: metadataAccount!.uri,
        tokenURI: metadataAccount!.uri,
        approved: true // all nina nfts approved by default
      }
      return details
    })

    const nftFactories: NftFactory[] = items.map(({ metadataAccount, release }) => ({
      address: metadataAccount!.mint.toBase58(),
      contractType: NFTContractTypeName.nina,
      platformId: MusicPlatformType.nina,
      standard: NFTStandard.METAPLEX,
      name: metadataAccount.metadata.name,
      symbol: metadataAccount.metadata.symbol,
      autoApprove: true, // all nina nfts are approved by default,
      approved: true, // index all nina nfts
      typeMetadata: {
        overrides: {
          artist: {
            artistId: (release.account.authority as web3.PublicKey).toBase58()
          }
        }
      }
    }));

    await clients.db.insert<Partial<NftFactory>>(Table.nftFactories, nftFactories)
    await clients.db.insert<Partial<NFT>>(Table.nfts, nfts)
  },
  initialCursor: undefined
};
