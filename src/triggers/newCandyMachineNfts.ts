

import { Metadata } from '@metaplex-foundation/js';
import { web3 } from '@project-serum/anchor';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js';
import _ from 'lodash';

import { Table } from '../db/db';
import { MetaFactory } from '../types/metaFactory';
import { NftFactory } from '../types/nft';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const MAX_CREATOR_LIMIT = 5;
const MAX_DATA_SIZE = 4 + MAX_NAME_LENGTH + 4 + MAX_SYMBOL_LENGTH + 4 + MAX_URI_LENGTH + 2 + 1 + 4 + MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;
const MAX_METADATA_LEN = 1 + 32 + 32 + MAX_DATA_SIZE + 1 + 1 + 9 + 172;
const CREATOR_ARRAY_START = 1 + 32 + 32 + 4 + MAX_NAME_LENGTH + 4 + MAX_URI_LENGTH + 4 + MAX_SYMBOL_LENGTH + 2 + 1 + 4;

const TOKEN_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const CANDY_MACHINE_V2_PROGRAM = new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ');

const getMintAddresses = async (clients: Clients,firstCreatorAddress: PublicKey) => {
  const metadataAccounts = await clients.solana.connection.getProgramAccounts(
    TOKEN_METADATA_PROGRAM,
    {
      // The mint address is located at byte 33 and lasts for 32 bytes.
      dataSlice: { offset: 33, length: 32 },

      filters: [
        // Only get Metadata accounts.
        { dataSize: MAX_METADATA_LEN },

        // Filter using the first creator.
        {
          memcmp: {
            offset: CREATOR_ARRAY_START,
            bytes: firstCreatorAddress.toBase58(),
          },
        },
      ],
    },
  );

  return metadataAccounts.map((metadataAccountInfo) => {
    return bs58.encode(metadataAccountInfo.account.data)
  });
};

const getCandyMachineCreator = async (candyMachine: PublicKey): Promise<[PublicKey, number]> => (
  PublicKey.findProgramAddress(
    [Buffer.from('candy_machine'), candyMachine.toBuffer()],
    CANDY_MACHINE_V2_PROGRAM,
  )
);

const getMintTx = async (clients: Clients, pubkey: PublicKey, options?: { before: string }): Promise<ConfirmedSignatureInfo> => {
  const txList = await clients.solana.connection.getSignaturesForAddress(pubkey, { ...options });

  if (txList.length === 1000){
    return getMintTx(clients, pubkey, { before: txList.at(-1)!.signature })
  }

  return txList.at(-1)!
}

export const newCandyMachineNfts: (metaFactory: MetaFactory) => Trigger<undefined> =
(metaFactory) => async (clients) => {

  const existingNFTFactories = new Set(
    (await clients.db.getRecords<NftFactory>(Table.nftFactories, [
      [
        'where', ['contractType', metaFactory.contractType]
      ]
    ])).map(nftFactory => nftFactory.id));


  const [candyMachineCreator] = (await getCandyMachineCreator(new web3.PublicKey(metaFactory.id)));
  const allMintAccounts = await getMintAddresses(clients, candyMachineCreator)
  const newMintAccounts = allMintAccounts.filter(mintAccount => !existingNFTFactories.has(mintAccount));

  const metadataAccounts = (
    await clients.solana.metaplex.nfts()
      .findAllByMintList(
        {
          mints: newMintAccounts.map(mint => new web3.PublicKey(mint))
        }
      ).run()
  ).filter(x => x) as Metadata[];

  const results: { metadataAccount: Metadata, mintTx: ConfirmedSignatureInfo }[] = 
  _.flatten(await Promise.all(
    metadataAccounts.map(async metadataAccount => {
      
      return {
        metadataAccount,
        mintTx: await getMintTx(clients, metadataAccount.mintAddress)
      }
    })
  ))

  return results
};
