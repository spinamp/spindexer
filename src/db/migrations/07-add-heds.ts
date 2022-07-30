import { Knex } from 'knex';

import { NFTContractTypeName, NftFactory, NFTStandard } from '../../types/ethereum';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

const HEDS_PLATFORM: MusicPlatform =
  { 
    id: 'heds',
    type: MusicPlatformType['single-track-multiprint-contract'],
    name: 'Heds',
  }

const HEDS_CONTRACTS: NftFactory[] = [
  {
    address: '0xde8a0b17d3dc0468adc65309881d9d6a6cd66372',
    startingBlock: '14193219',
    platformId: HEDS_PLATFORM.id,
    contractType: NFTContractTypeName.default,
    standard: NFTStandard.ERC721,
  },
  {
    address: '0x5083cf11003f2b25ca7456717e6dc980545002e5',
    platformId: HEDS_PLATFORM.id,
    startingBlock: '14373903',
    contractType: NFTContractTypeName.default,
    standard: NFTStandard.ERC721,
  },
  {
    address: '0x567e687c93103010962f9e9cf5730ae8dbfc6d41',
    platformId: HEDS_PLATFORM.id,
    startingBlock: '14548643',
    contractType: NFTContractTypeName.default,
    standard: NFTStandard.ERC721,
  },
  {
    address: '0x8045fd700946a00436923f37d08f280ade3b4af6',
    platformId: HEDS_PLATFORM.id,
    startingBlock: '14813870',
    contractType: NFTContractTypeName.default,
    standard: NFTStandard.ERC721,
  }
]

export const up = async (knex: Knex) => {
  await addPlatform(knex, HEDS_PLATFORM);

  HEDS_CONTRACTS.forEach(contract => addNftFactory(knex, contract));

};

exports.down = async (knex: Knex) => {
  // await knex.raw(`delete from "${Table.nfts}" where "platformId" = 'heds'`)
  // const result = await knex.raw(`select cursor from processors where id='createERC721NFTsFromTransfers';`);
  // todo: add to remove platform helper
  // const parsedCursor = JSON.parse(result.rows[0].cursor);
  // delete parsedCursor['0xde8a0b17d3dc0468adc65309881d9d6a6cd66372'];
  // delete parsedCursor['0x5083cf11003f2b25ca7456717e6dc980545002e5'];
  // delete parsedCursor['0x567e687c93103010962f9e9cf5730ae8dbfc6d41'];
  // delete parsedCursor['0x8045fd700946a00436923f37d08f280ade3b4af6'];
  // const updatedCursor = JSON.stringify(parsedCursor);
  // await knex.raw(`update processors set cursor='${updatedCursor}' where id='createERC721NFTsFromTransfers';`);
  // await knex.raw(`delete from "${Table.nftFactories}" where id in ('0xde8a0b17d3dc0468adc65309881d9d6a6cd66372','0x5083cf11003f2b25ca7456717e6dc980545002e5','0x567e687c93103010962f9e9cf5730ae8dbfc6d41','0x8045fd700946a00436923f37d08f280ade3b4af6')`)
  // await knex.raw(`delete from "${Table.platforms}" where id = 'heds'`)

  await removePlatform(knex, HEDS_PLATFORM)

  HEDS_CONTRACTS.forEach(contract => removeNftFactory(knex, contract));
}
