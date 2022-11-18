import { Knex } from 'knex';

import { formatAddress } from '../../types/address';
import { Chain, ChainId, ChainType } from '../../types/chain';
import { getCrdtUpsertMessage } from '../../types/message';
import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { Table } from '../db';
import { updateViews } from '../migration-helpers';

const LENS_PLATFORM: MusicPlatform = {
  id: 'lens',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'Lens'
}

const LENS_HUB: MetaFactory = {
  id: `${ChainId.polygon}/0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d`,
  platformId: LENS_PLATFORM.id,
  contractType: MetaFactoryTypeName.lens,
  standard: NFTStandard.ERC721,
  autoApprove: false,
  startingBlock: '28384640',
  chainId: ChainId.polygon,
  address: formatAddress('0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d')
}

const ETHEREUM: Chain = {
  id: ChainId.ethereum,
  name: 'Ethereum',
  type: ChainType.evm,
  rpcUrlKey: 'ETHEREUM_PROVIDER_ENDPOINT'
}

const POLYGON: Chain = {
  id: ChainId.polygon,
  name: 'Polygon POS',
  type: ChainType.evm,
  rpcUrlKey: 'POLYGON_PROVIDER_ENDPOINT'
}

const SOLANA: Chain = {
  id: ChainId.solana,
  name: 'Solana',
  type: ChainType.solana,
  rpcUrlKey: 'SOLANA_PROVIDER_ENDPOINT'
}

export const up = async (knex: Knex) => {

  // create chains
  await knex.schema.createTable(Table.chains, table => {
    table.string('id').primary(),
    table.string('name').notNullable(),
    table.string('rpcUrlKey').notNullable()
    table.string('type').notNullable()
  })

  await knex(Table.chains).insert(ETHEREUM);
  await knex(Table.chains).insert(POLYGON);
  await knex(Table.chains).insert(SOLANA);

  // alter factories
  await knex.schema.alterTable(Table.nftFactories, table => {
    table.string('chainId')
    table.string('address')
  })
  
  await knex.schema.alterTable(Table.metaFactories, table => {
    table.string('chainId')
    table.string('address')
  })

  // update factories
  const nftFactoryUpdates = `
    update ${Table.nftFactories}
    set address=id,
    "chainId"= 
    case
      when "standard" = '${NFTStandard.METAPLEX}' then 'solana'
      else 'ethereum'
    end
  `
  const metaFactoryUpdates = `
    update ${Table.metaFactories}
    set address=id,
    "chainId"= 
    case
      when "standard" = '${NFTStandard.METAPLEX}' then 'solana'
      else 'ethereum'
    end
  `

  await knex.raw(nftFactoryUpdates);
  await knex.raw(metaFactoryUpdates);

  //add constraints to factories
  await knex.schema.alterTable(Table.nftFactories, table => {
    table.string('address').notNullable().alter()
    table.foreign('chainId').references('id').inTable(Table.chains).onDelete('cascade');
  })
  
  await knex.schema.alterTable(Table.metaFactories, table => {
    table.string('address').notNullable().alter()
    table.foreign('chainId').references('id').inTable(Table.chains).onDelete('cascade');
  })

  // alter transfers
  await knex.schema.alterTable(Table.erc721Transfers, table => {
    table.string('chainId')
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  // update transfers
  const transfersUpdate = `
    update ${Table.erc721Transfers}
    set "chainId" = '${ChainId.ethereum}'
  `

  await knex.raw(transfersUpdate);

  // add constraints to transfers
  await knex.schema.alterTable(Table.erc721Transfers, table => {
    table.foreign('chainId').references('id').inTable(Table.chains).onDelete('cascade');
  })

  // alter nfts
  await knex.schema.alterTable(Table.nfts, table => {
    table.string('chainId')
    table.renameColumn('contractAddress', 'nftFactoryId')
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })
  await knex.schema.alterTable(Table.nfts, table => {
    table.string('contractAddress')
  })

  // update nfts
  const nftsUpdate = `
    update ${Table.nfts}
    set "contractAddress" = "nftFactoryId",
    "chainId"= 
    case
      when "platformId" = 'nina' or "platformId" = 'kota' then 'solana'
      else 'ethereum'
    end
  `

  await knex.raw(nftsUpdate);

  // add constraints to nfts
  await knex.schema.alterTable(Table.nfts, table => {
    table.foreign('chainId').references('id').inTable(Table.chains).onDelete('cascade');
    table.string('contractAddress').notNullable().alter()
  })

  // alter other tables
  await knex.schema.alterTable(Table.artists, table => {
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  await knex.schema.alterTable(Table.artistProfiles, table => {
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  await knex.schema.alterTable(Table.processedTracks, table => {
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  
  const platformMessage = getCrdtUpsertMessage(Table.platforms, LENS_PLATFORM, process.env.DEFAULT_ADMIN_ADDRESS! )
  const metaFactoryMessage = getCrdtUpsertMessage(Table.metaFactories, LENS_HUB as MetaFactory, process.env.DEFAULT_ADMIN_ADDRESS!)

  await knex(Table.seeds).insert(platformMessage);
  await knex(Table.seeds).insert(metaFactoryMessage);

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  return;
}
