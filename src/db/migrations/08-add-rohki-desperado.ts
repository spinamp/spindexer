
import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

const ROHKI_PLATFORM: MusicPlatform = {
  id: 'rohki',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'RŌHKI',
}

const ROHKI_DESPERADO: NftFactory = {
  address: '0xe8e7Eb47dD7eaFeC80c1EF7f0aE39beE6Dbce469',
  startingBlock: '14779299',
  platformId: ROHKI_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  typeMetadata: {
    overrides: {
      track: {
        lossyAudioIPFSHash: 'QmcnpLmiLpMNMMpcJkKjKTgwcsUyUWTstFtRZat6TYsmBV',
        lossyArtworkIPFSHash: 'QmZWbY9VtabJ6ZRieUo5LoetBuBBETKeJhjF5upstj29jp',
        title: 'Desperado',
        websiteUrl: 'https://www.rohki.xyz/'
      },
      artist: {
        name: 'RŌHKI',
        avatarUrl: 'https://lh3.googleusercontent.com/jyOxrrZ5Nhton5vIAL10yCFexExXjLWhU_KfGYNjm7pC1conv3BzH1PUYGqyD_4cvAEskqs-gOCN5uhCbuKVdorh_MRwqitEjuWzDJs=s0',
        websiteUrl: 'https://www.rohki.xyz/'
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, ROHKI_PLATFORM)
  await addNftFactory(knex, ROHKI_DESPERADO)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, ROHKI_DESPERADO);
  await removePlatform(knex, ROHKI_PLATFORM)
}
