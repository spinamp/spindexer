import * as MetaplexFoundation from '@metaplex-foundation/js';
import { web3, AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';
import _ from 'lodash';

import { Table } from '../db/db';
import { MetaFactory } from '../types/metaFactory';
import { NFT } from '../types/nft';
import { MusicPlatformType } from '../types/platform';
import { Trigger } from '../types/trigger';

export const newNinaContracts: Trigger<undefined> = async (clients) => {
  const factory = (await clients.db.getRecords<MetaFactory>(Table.metaFactories, [
    [
      'where', ['platformId', MusicPlatformType.nina]
    ]
  ]))[0]

  const endpoint = process.env.SOLANA_PROVIDER_ENDPOINT;

  if (!endpoint) {
    throw 'No solana endpoint configured'
  }

  const connection = new web3.Connection(endpoint);
  const provider = new AnchorProvider(connection, new Wallet(new Keypair()), {})
  const nina = await Program.at(
    factory.address,
    provider,
  )

  const metaplex = new MetaplexFoundation.Metaplex(connection);

  // Fetch all releases from Solana via Anchor
  const releases = await nina.account.release.all();
  const metadataAccounts = (
    await metaplex.nfts()
      .findAllByMintList(
        releases.map(
          release => release.account.releaseMint as web3.PublicKey
        )
      )
  ).filter(x => x);

  const existingContracts = (await clients.db.getRecords<NFT>(Table.nfts, [
    [
      'where', ['platformId', MusicPlatformType.nina]
    ]
  ])).map(nft => nft.contractAddress)

  const allMintAccounts = new Set(metadataAccounts.map(account => account!.mint.toBase58()));
  const existingMintAccounts = new Set(existingContracts);

  const releasesByMintAddress = _.keyBy(releases, release => (release.account.releaseMint as web3.PublicKey).toBase58())

  const newMintAccounts = new Set(([...allMintAccounts].filter(mint => !existingMintAccounts.has(mint))));

  return metadataAccounts.filter(account => newMintAccounts.has(account!.mint.toBase58())).map(account => ({
    metadataAccount: account,
    release: releasesByMintAddress[account!.mint.toBase58()]
  }))
};

export const missingCreatedAtTimeWithMetadataDate: Trigger<undefined> = async (clients) => {
  const nftQuery = `
    select *
    from "${Table.nfts}"
    where "createdAtTime" is null
    and metadata -> 'properties' -> 'date' is not null
    limit ${process.env.QUERY_TRIGGER_BATCH_SIZE}
`;

  const nfts = (await clients.db.rawSQL(nftQuery)).rows
  return nfts;
};
