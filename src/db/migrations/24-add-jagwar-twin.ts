import { Knex } from 'knex';

import { createArtistIdFromEthereumAddress } from '../../types/artist';
import { CustomFieldExtractor } from '../../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { MusicPlatform, MusicPlatformType } from '../../types/platform';
import { addNftFactory, addPlatform, removeNftFactory, removePlatform } from '../migration-helpers';

const jagwarTwinAddress = '0xe80c7fee3d41e311e0351244231919e04e699e56';

const JAGWAR_TWIN_PLATFORM: MusicPlatform = {
  id: jagwarTwinAddress,
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'jagwartwin.com',
}

const THOUGHT_FORMS_NFT_FACTORY: NftFactory = {
  id: '0x605B0E6b2Ec949235ff5Ac05bD452E22d21c702d',
  startingBlock: '14779895',
  platformId: JAGWAR_TWIN_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  approved: true,
  autoApprove: true,
  typeMetadata: {
    overrides: {
      track: {
        title: 'East Is Everywhere',
        websiteUrl: 'https://jagwartwin.com/'
      },
      artist: {
        name: 'Jagwar Twin',
        artistId: createArtistIdFromEthereumAddress(jagwarTwinAddress),
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmcBb9C69vvJXasxTYFPwpo9WuZv415KkH3wTdoeBMH2hH',
        websiteUrl: 'https://jagwartwin.com/'
      },
      extractor: {
        title: CustomFieldExtractor.METADATA_NAME,
      }
    }
  }
};

export const up = async (knex: Knex) => {
  await addPlatform(knex, JAGWAR_TWIN_PLATFORM);
  await addNftFactory(knex, THOUGHT_FORMS_NFT_FACTORY);
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, THOUGHT_FORMS_NFT_FACTORY);
  await removePlatform(knex, JAGWAR_TWIN_PLATFORM);
}
