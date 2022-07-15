
import { Knex } from 'knex';

import { ERC721Contract, ERC721ContractTypeName } from '../../types/ethereum';
import { Table } from '../db';
import { addErc721Contract, removeErc721Contract } from '../migration-helpers';

const ROHKI_VROOM: ERC721Contract = {
  address: '0x317394c6dFB5606c2917E1a0DAD4f1B70EDDC921',
  startingBlock: '15112828',
  platformId: 'rohki',
  contractType: ERC721ContractTypeName.default,
  typeMetadata: {
    overrides: {
      track: {
        // lossyAudioIPFSHash: 'QmcnpLmiLpMNMMpcJkKjKTgwcsUyUWTstFtRZat6TYsmBV',
        // lossyArtworkIPFSHash: 'QmZWbY9VtabJ6ZRieUo5LoetBuBBETKeJhjF5upstj29jp',
        title: 'Vroom',
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
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" drop constraint "erc721nftprocesserrors_erc721nftid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" add constraint "erc721nftprocesserrors_erc721nftid_foreign" foreign key ("erc721nftId") references "${Table.erc721nfts}" (id) on delete cascade`);      

  await addErc721Contract(knex, ROHKI_VROOM)
}

export const down = async (knex: Knex) => {
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" drop constraint "erc721nftprocesserrors_erc721nftid_foreign"`);      
  await knex.raw(`ALTER TABLE "${Table.erc721nftProcessErrors}" add constraint "erc721nftprocesserrors_erc721nftid_foreign" foreign key ("erc721nftId") references "${Table.erc721nfts}" (id)`);      

  await removeErc721Contract(knex, ROHKI_VROOM);
}
