import { Knex } from 'knex';

import { IdExtractorTypes, TitleExtractorTypes, WebsiteUrlExtractorTypes } from '../../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

const HOLLY_PLUS_PLATFORM: MusicPlatform = {
  id: 'hollyplus',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'hollyplus',
}

const HOLLY_PLUS: NftFactory = {
  id: '0x6688Ee4E6e17a9cF88A13Da833b011E64C2B4203',
  startingBlock: '13001583',
  platformId: 'hollyplus',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'hollyplus',
        websiteUrl: 'https://auction.holly.plus/',
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmQ2AbbqTD5BF4Y12YwtDaosn2k9LGGS6VeXn28bapwHJY',
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        websiteUrl: WebsiteUrlExtractorTypes.USE_TOKEN_ID_APPENDED_EXTERNAL_URL,
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, HOLLY_PLUS_PLATFORM);
  await addNftFactory(knex, HOLLY_PLUS);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, HOLLY_PLUS);
  await removePlatform(knex, HOLLY_PLUS_PLATFORM);
}
