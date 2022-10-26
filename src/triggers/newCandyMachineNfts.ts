

import { JsonMetadata, Metadata } from '@metaplex-foundation/js';
import { web3 } from '@project-serum/anchor';
import { ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js';
import _ from 'lodash';

import { Table } from '../db/db';
import { MetaFactory } from '../types/metaFactory';
import { NftFactory } from '../types/nft';
import { Trigger } from '../types/trigger';
import { rollPromises } from '../utils/rollingPromises';

export const newCandyMachineNfts: (metaFactory: MetaFactory) => Trigger<undefined> =
(metaFactory) => async (clients) => {
  const existingNFTFactories = new Set(
    (await clients.db.getRecords<NftFactory>(Table.nftFactories, [
      [
        'where', ['platformId', metaFactory.platformId]
      ]
    ])).map(nftFactory => nftFactory.id));


  const allMintAccounts = await clients.solana.getMintAddressesForCandyMachine(new PublicKey(metaFactory.id))
  const newMintAccounts = allMintAccounts.filter(mintAccount => !existingNFTFactories.has(mintAccount));
  console.log('new candy machine nfts', newMintAccounts)
  const chunks = _.chunk(newMintAccounts, 100)

  const getMetadataAccounts = async(mintAccounts: string[]): Promise<{ metadataAccount: Metadata<JsonMetadata<string>>, mintTx: ConfirmedSignatureInfo }[]> => {
    const metadataAccounts = (
      await clients.solana.metaplex.nfts()
        .findAllByMintList(
          {
            mints: mintAccounts.map(mint => new web3.PublicKey(mint))
          }
        ).run()
    ).filter(x => x) as Metadata[];
    
    const withMintTx = await Promise.all(
      metadataAccounts.map(async metadataAccount => ({
        metadataAccount,
        mintTx: await clients.solana.getMintTx(metadataAccount.mintAddress)
      }))
    )

    return _.flatten(withMintTx);
  }

  const metadataAccountResults = await rollPromises(chunks, getMetadataAccounts, 100, 30)
  return _.flatten(metadataAccountResults.map(result => result.response!))
};
