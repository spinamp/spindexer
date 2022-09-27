
import { Knex } from 'knex';

import { ArtistIdExtractorTypes, ArtistNameExtractorTypes, IdExtractorTypes, TitleExtractorTypes } from '../../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { ethereumArtistId } from '../../utils/identifiers';
import { addPlatform, addNftFactory, removeNftFactory, removePlatform } from '../migration-helpers';

const GLASSHOUSE_PLATFORM: MusicPlatform = {
  id: '0x719C6d392fc659f4fe9b0576cBC46E18939687a7',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'danielallan.xyz',
}

const GLASSHOUSE: NftFactory = {
  id: '0x719C6d392fc659f4fe9b0576cBC46E18939687a7',
  startingBlock: '15151004',
  platformId: GLASSHOUSE_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Daniel Allan',
        artistId: ethereumArtistId('0xbcefc4906b443e4db64e2b00b9af2c39e76c785c'),
        avatarUrl: 'https://storageapi.fleek.co/catalogworks-team-bucket/prod/users/0xbcefc4906b443e4db64e2b00b9af2c39e76c785c/images/profile_picture.jpeg'
      },
      extractor: {
        title: TitleExtractorTypes.ATTRIBUTES_TRAIT_TRACK,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
        artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, GLASSHOUSE_PLATFORM)
  await addNftFactory(knex, GLASSHOUSE)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, GLASSHOUSE);
  await removePlatform(knex, GLASSHOUSE_PLATFORM)
}
