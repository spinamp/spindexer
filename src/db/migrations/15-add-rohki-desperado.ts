
import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { Table } from '../db';
import { addPlatform, removeErc721Contract, removePlatform } from '../migration-helpers';

const ROHKI_PLATFORM = {
  id: 'rohki',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'RŌHKI',
}

const ROHKI_DESPERADO: NftFactory = {
  address: '0xe8e7Eb47dD7eaFeC80c1EF7f0aE39beE6Dbce469',
  startingBlock: '14779299',
  platformId: ROHKI_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.METAPLEX,
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
  await knex.schema.alterTable(Table.erc721Contracts, table => {
    table.jsonb('typeMetadata')
  })
  await addPlatform(knex, ROHKI_PLATFORM, ROHKI_DESPERADO)
}

export const down = async (knex: Knex) => {
  await knex.schema.alterTable(Table.erc721Contracts, table => {
    table.dropColumn('typeMetadata')
  })
  await removeErc721Contract(knex, ROHKI_DESPERADO);
  await removePlatform(knex, ROHKI_PLATFORM, ROHKI_DESPERADO)
}
