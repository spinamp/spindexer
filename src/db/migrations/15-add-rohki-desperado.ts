
import { Knex } from 'knex';

import { ERC721Contract, ERC721ContractTypeName } from '../../types/ethereum';
import { MusicPlatformType } from '../../types/platform';
import { Table } from '../db';
import { addPlatform, removeErc721Contract, removePlatform } from '../migration-helpers';

const ROHKI_PLATFORM = {
  id: 'rohki',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'rohki desperado',
}

const ROHKI_DESPERADO: ERC721Contract = {
  address: '0xe8e7Eb47dD7eaFeC80c1EF7f0aE39beE6Dbce469',
  startingBlock: '14779299',
  platformId: ROHKI_PLATFORM.id,
  contractType: ERC721ContractTypeName.default,
  typeMetadata: {
    overrides: {
      track: {
        lossyAudioURL: 'https://www.rohki.xyz/audio/ROHKI-Desperado.mp3?gubed=true',
        lossyArtworkURL: 'https://arweave.net/lQEtDj_2BVTfl13ZVDomDl-xQdMbo6VssVlGUK_e_Oo/immersive.gif'
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