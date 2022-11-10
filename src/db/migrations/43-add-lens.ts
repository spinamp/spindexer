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
  name: 'LENS'
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

export const up = async (knex: Knex) => {

  await knex.schema.createTable(Table.chains, table => {
    table.string('id').primary(),
    table.string('name').notNullable(),
    table.string('rpcUrl').notNullable()
    table.string('type').notNullable()
  })

  await knex.schema.alterTable(Table.nftFactories, table => {
    table.string('chainId').references('id').inTable(Table.chains).onDelete('cascade');
    table.string('address').notNullable()
  })

  // TODO: backfill address on existing metafactories
  
  await knex.schema.alterTable(Table.metaFactories, table => {
    table.string('chainId').references('id').inTable(Table.chains).onDelete('cascade');
    table.string('address').notNullable()
  })
  
  await knex.schema.alterTable(Table.erc721Transfers, table => {
    table.string('chainId').references('id').inTable(Table.chains).onDelete('cascade');
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })
  
  await knex.schema.alterTable(Table.nfts, table => {
    table.string('chainId').references('id').inTable(Table.chains).onDelete('cascade');
    table.renameColumn('contractAddress', 'nftFactoryId')
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  await knex.schema.alterTable(Table.nfts, table => {
    table.string('contractAddress').notNullable
  })

  await knex.schema.alterTable(Table.artists, table => {
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  await knex.schema.alterTable(Table.artistProfiles, table => {
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  await knex.schema.alterTable(Table.processedTracks, table => {
    table.renameColumn('createdAtEthereumBlockNumber', 'createdAtBlockNumber')
  })

  
  const ETHEREUM: Chain = {
    id: ChainId.ethereum,
    name: 'Ethereum',
    type: ChainType.evm,
    rpcUrl: process.env.ETHEREUM_PROVIDER_ENDPOINT!
  }
  
  const POLYGON: Chain = {
    id: ChainId.polygon,
    name: 'Polygon POS',
    type: ChainType.evm,
    rpcUrl: process.env.POLYGON_PROVIDER_ENDPOINT!
  }
  
  const SOLANA: Chain = {
    id: ChainId.solana,
    name: 'Solana',
    type: ChainType.solana,
    rpcUrl: process.env.SOLANA_PROVIDER_ENDPOINT!
  }
  
  await knex(Table.chains).insert(ETHEREUM);
  await knex(Table.chains).insert(POLYGON);
  await knex(Table.chains).insert(SOLANA);

  await knex.raw(`
    update ${Table.nftFactories}
    set "chainId" = '${ChainId.ethereum}'
    where "standard" = '${NFTStandard.ERC721}'
  `)

  await knex.raw(`
    update ${Table.nftFactories}
    set "chainId" = '${ChainId.solana}'
    where "standard" = '${NFTStandard.METAPLEX}'
  `)

  await knex.raw(`
    update ${Table.metaFactories}
    set "chainId" = '${ChainId.ethereum}'
    where "standard" = '${NFTStandard.ERC721}'
  `)

  await knex.raw(`
    update ${Table.metaFactories}
    set "chainId" = '${ChainId.solana}'
    where "standard" = '${NFTStandard.METAPLEX}'
  `)
  
  const platformMessage = getCrdtUpsertMessage(Table.platforms, LENS_PLATFORM, process.env.DEFAULT_ADMIN_ADDRESS! )
  const metaFactoryMessage = getCrdtUpsertMessage(Table.metaFactories, LENS_HUB as MetaFactory, process.env.DEFAULT_ADMIN_ADDRESS!)

  await knex(Table.seeds).insert(platformMessage);
  await knex(Table.seeds).insert(metaFactoryMessage);

  await updateViews(knex);
}

export const down = async (knex: Knex) => {
  return;
}
