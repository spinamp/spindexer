import { Knex } from 'knex';

import { AudioUrlExtractorTypes, IdExtractorTypes, TitleExtractorTypes } from '../../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

const RELICS_YXZ: MusicPlatform = {
  id: 'relics',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'relics',
}

const SEASONS_1: NftFactory = {
  id: '0x441C1266E6fb13C38c2752eab0D11A99905FFef4',
  startingBlock: '14180427',
  platformId: 'relics',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        // TODO: add extractor for artist ID?
        name: 'RELICS',
        websiteUrl: 'https://relics.xyz',
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmS6WbpHrMYsu6Tmts61FfqiEwmrzJRrPrnN9o5qGDzME4',
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        title: TitleExtractorTypes.METADATA_NAME,
        audioUrl: AudioUrlExtractorTypes.ATTRIBUTES_TRAIT_AUDIO
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, RELICS_YXZ);
  await addNftFactory(knex, SEASONS_1);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, SEASONS_1);
  await removePlatform(knex, RELICS_YXZ);
}
