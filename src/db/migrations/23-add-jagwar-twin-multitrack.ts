import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatformType } from '../../types/platform';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const jagwarTwinAddress = '0xe80c7fee3d41e311e0351244231919e04e699e56';

const ALBUM_NFT_FACTORY: NftFactory = {
  address: '0xF85c1f4aC0040e4f2369cFcbAbfccfa2F3E6899E',
  startingBlock: '14449704',
  platformId: jagwarTwinAddress,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Jagwar Twin',
        artistId: jagwarTwinAddress,
      },
      type: MusicPlatformType['multi-track-multiprint-contract']
    }
  }
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, ALBUM_NFT_FACTORY);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, ALBUM_NFT_FACTORY);
}
