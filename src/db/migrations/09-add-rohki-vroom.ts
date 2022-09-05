
import { Knex } from 'knex';

import { NftFactory, NFTContractTypeName, NFTStandard } from '../../types/nft';
import { addNftFactory, removeNftFactory } from '../migration-helpers';

const ROHKI_VROOM: NftFactory = {
  id: '0x317394c6dFB5606c2917E1a0DAD4f1B70EDDC921',
  startingBlock: '15112828',
  platformId: 'rohki',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      track: {
        lossyAudioIPFSHash: 'QmdWicgFzBY1pK2Bg9FjHTu8gvXH6bfvdS3v5XksBHPdZ8',
        lossyArtworkIPFSHash: 'QmcjiGuADJz9v2MYVHt92Td5kEyHUhfCMQwvJav3c6a1Dv',
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
  await addNftFactory(knex, ROHKI_VROOM)
}

export const down = async (knex: Knex) => {
  await removeNftFactory(knex, ROHKI_VROOM);
}
