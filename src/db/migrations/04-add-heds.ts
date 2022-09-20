import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addPlatform, addNftFactory, removePlatform, removeNftFactory } from '../migration-helpers';

const HEDS_PLATFORM: MusicPlatform =
  {
    id: 'heds',
    type: MusicPlatformType['single-track-multiprint-contract'],
    name: 'Heds',
  }

export const HEDSTAPE_1 = {
  id: '0xde8a0b17d3dc0468adc65309881d9d6a6cd66372',
  startingBlock: '14193218',
  platformId: HEDS_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true

}

export const HEDSTAPE_2 = {
  id: '0x5083cf11003f2b25ca7456717e6dc980545002e5',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '14373902',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true


}

export const HEDSTAPE_3 = {
  id: '0x567e687c93103010962f9e9cf5730ae8dbfc6d41',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '14548642',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true


}

export const HEDSTAPE_4 = {
  id: '0x8045fd700946a00436923f37d08f280ade3b4af6',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '14813869',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

const HEDS_CONTRACTS: NftFactory[] = [
  HEDSTAPE_1,
  HEDSTAPE_2,
  HEDSTAPE_3,
  HEDSTAPE_4
]

export const up = async (knex: Knex) => {
  await addPlatform(knex, HEDS_PLATFORM);

  HEDS_CONTRACTS.forEach(contract => addNftFactory(knex, contract));

};

exports.down = async (knex: Knex) => {
  await removePlatform(knex, HEDS_PLATFORM)

  HEDS_CONTRACTS.forEach(contract => removeNftFactory(knex, contract));
}
