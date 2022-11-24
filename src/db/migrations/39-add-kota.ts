import { Knex } from 'knex';

import { ChainId } from '../../types/chain';
import { ArtistIdExtractorTypes, ArtistNameExtractorTypes, TitleExtractorTypes } from '../../types/fieldExtractor';
import { CrdtOperation } from '../../types/message';
import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { Table } from '../db';

const KOTA_PLATFORM: MusicPlatform = {
  id: 'kota',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'KOTA',
}

const KOTA: MetaFactory = {
  id: '2ZvRTpStD4gQ9WPoXuiA4MtFpiZze9K9fPfFtCTnzdGo',
  address: '2ZvRTpStD4gQ9WPoXuiA4MtFpiZze9K9fPfFtCTnzdGo',
  platformId: KOTA_PLATFORM.id,
  contractType: MetaFactoryTypeName.candyMachine,
  standard: NFTStandard.METAPLEX,
  autoApprove: true,
  chainId: ChainId.solana,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Kids of the Apocalypse'
      },
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME_WITHOUT_TRAILING_INFO,
        artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
        artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await knex.schema.alterTable(Table.metaFactories, table => {
    table.jsonb('typeMetadata')
  })

  const platform = {
    timestamp: new Date(),
    table: Table.platforms,
    data: KOTA_PLATFORM,
    operation: CrdtOperation.UPSERT,
  }

  const metaFactory = {
    timestamp: new Date(),
    table: Table.metaFactories,
    data: KOTA,
    operation: CrdtOperation.UPSERT,
  }

  await knex(Table.seeds).insert(platform)
  await knex(Table.seeds).insert(metaFactory)
}

export const down = async (knex: Knex) => {
  throw 'not implemented'
}
