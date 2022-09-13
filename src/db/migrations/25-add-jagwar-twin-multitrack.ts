import { Knex } from 'knex';

import { IdExtractorTypes, TitleExtractorTypes, WebsiteUrlExtractorTypes } from '../../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatformType } from '../../types/platform';
import { ethereumArtistId } from '../../utils/identifiers';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const jagwarTwinAddress = '0xe80c7fee3d41e311e0351244231919e04e699e56';

const ALBUM_NFT_FACTORY: NftFactory = {
  id: '0xF85c1f4aC0040e4f2369cFcbAbfccfa2F3E6899E',
  startingBlock: '14449704',
  platformId: jagwarTwinAddress,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Jagwar Twin',
        artistId: ethereumArtistId(jagwarTwinAddress),
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmcBb9C69vvJXasxTYFPwpo9WuZv415KkH3wTdoeBMH2hH',
        websiteUrl: 'https://jagwartwin.com/'
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.ATTRIBUTES_TRAIT_SONG_TITLE,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        websiteUrl: WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, ALBUM_NFT_FACTORY);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, ALBUM_NFT_FACTORY);
}
