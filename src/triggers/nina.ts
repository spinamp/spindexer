import { web3, AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';

import { Table } from '../db/db';
import { fromDBRecords } from '../db/orm';
import { ERC721Contract, FactoryContract } from '../types/ethereum';
import { MusicPlatformType } from '../types/platform';
import { Trigger } from '../types/trigger';


export const ninaContractsWithoutNfts: Trigger<undefined> = async (clients) => {
  const nftQuery = `
  select ec.*
  from "${Table.erc721Contracts}" ec 
  left outer join "${Table.erc721nfts}" en 
  on en."platformId"  = ec."platformId" 
  where ec."platformId" = '${MusicPlatformType.nina}'
  and en.id is null
  `
  const contracts = (await clients.db.rawSQL(nftQuery))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));

  return fromDBRecords(Table.erc721Contracts, contracts)
};

export const newNinaContracts: Trigger<undefined> = async (clients) => {
  const factory = (await clients.db.getRecords<FactoryContract>(Table.factoryContracts, [
    [
      'where', ['platformId', MusicPlatformType.nina] 
    ]
  ]))[0]
  
  const connection = new web3.Connection('https://ssc-dao.genesysgo.net/');
  const provider = new AnchorProvider(connection, new Wallet(new Keypair()), {})
  const nina = await Program.at(
    factory.address,
    provider,
  )
  
  // Fetch all releases from Solana via Anchor
  const releases = await nina.account.release.all();
  const releaseAddresses = releases.map(release => release.account.releaseMint.toBase58());

  const existingContracts = (await clients.db.getRecords<ERC721Contract>(Table.erc721Contracts, [
    [
      'where', ['platformId', MusicPlatformType.nina]
    ]
  ])).map(contract => contract.address)

  const newReleases = releaseAddresses.filter(address => !existingContracts.includes(address))

  return newReleases
};
  