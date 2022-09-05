import { Knex } from 'knex';

import { createArtistIdFromEthereumAddress } from '../../types/artist';
import { TitleExtractorTypes } from '../../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatformType } from '../../types/platform';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const jagwarTwinAddress = '0xe80c7fee3d41e311e0351244231919e04e699e56';

const ARTIFACTS: NftFactory = {
  address: '0x84F89f7bAcb20970073Be33F22847e58fbe78992',
  startingBlock: '15316663',
  platformId: jagwarTwinAddress,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: false,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Jagwar Twin',
        artistId: createArtistIdFromEthereumAddress(jagwarTwinAddress),
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addNftFactory(knex, ARTIFACTS);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, ARTIFACTS);
}
