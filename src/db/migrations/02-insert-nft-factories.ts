import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

export const NOIZD = {
  id: '0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6',
  platformId: 'noizd',
  startingBlock: '13470560',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

export const CATALOG = {
  id: '0x0bc2a24ce568dad89691116d5b34deb6c203f342',
  platformId: 'catalog',
  startingBlock: '14566825',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

const INITIAL_CONTRACTS: NftFactory[] = [
  {
    id: '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7',
    startingBlock: '11565019',
    contractType: NFTContractTypeName.zora,
    standard: NFTStandard.ERC721,
    platformId: 'zoraOriginal',
    autoApprove: true,
    approved: true
  },
  NOIZD,
  CATALOG
]

export const up = async (knex: Knex) => {
  INITIAL_CONTRACTS.forEach(contract => {
    addNftFactory(knex, contract )
  })
};

exports.down = async (knex: Knex) => {
  INITIAL_CONTRACTS.forEach(contract => {
    removeNftFactory(knex, contract )
  })
}
