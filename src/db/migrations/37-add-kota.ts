import { Knex } from 'knex';

import { ArtistIdExtractorTypes, ArtistNameExtractorTypes, IdExtractorTypes, TitleExtractorTypes } from '../../types/fieldExtractor';
import { MetaFactory, MetaFactoryTypeName } from '../../types/metaFactory';
import { NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { Table } from '../db';
import { addMetaFactory, addPlatform, removeMetaFactory, removePlatform, updateViews } from '../migration-helpers';

const KOTA_PLATFORM: MusicPlatform = {
  id: 'kota',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'KOTA',
}

const KOTA: MetaFactory = {
  id: '2ZvRTpStD4gQ9WPoXuiA4MtFpiZze9K9fPfFtCTnzdGo',
  platformId: KOTA_PLATFORM.id,
  contractType: MetaFactoryTypeName.kota,
  standard: NFTStandard.METAPLEX,
  autoApprove: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Kids of the Apocalypse'
      },
      extractor: {
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
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


  await addPlatform(knex, KOTA_PLATFORM);
  await addMetaFactory(knex, KOTA);

  await updateViews(knex)
}

export const down = async (knex: Knex) => {
  await removeMetaFactory(knex, KOTA);
  await removePlatform(knex, KOTA_PLATFORM);
}
