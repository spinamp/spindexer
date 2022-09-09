import { Knex } from 'knex';

import { IdExtractorTypes, TitleExtractorTypes } from '../../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { ethereumArtistId } from '../../utils/identifiers';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';


const mighty33Address = '0x8C62dD796e13aD389aD0bfDA44BB231D317Ef6C6';

const MIGHTY_33: MusicPlatform = {
  id: mighty33Address,
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'Mighty33',
}

const OTHERS_DIE: NftFactory = {
  id: '0x97b9f21b41041e344f5bd71e3e86b69e79dcc0a6',
  startingBlock: '10876005',
  platformId: mighty33Address,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Mighty33',
        artistId: ethereumArtistId(mighty33Address),
        avatarUrl: 'https://lh3.googleusercontent.com/IurC9VfibdFS8GtYHbPuEvMfDP_HD2YnLKFVLee9WouwIjtvQwFxBfc-UT6ypNRAAmK73Esfb92OyB3so4rXR3N-6_4iDhDElMzHPJQ=s0',
        websiteUrl: 'https://geniuscorp.fr/m33'
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, MIGHTY_33);
  await addNftFactory(knex, OTHERS_DIE);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, OTHERS_DIE);
  await removePlatform(knex, MIGHTY_33);
}
