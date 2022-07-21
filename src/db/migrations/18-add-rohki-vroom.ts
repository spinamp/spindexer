
import { Knex } from 'knex';

import { NFTContractTypeName, NftFactory, NFTStandard } from '../../types/ethereum';
import { addErc721Contract, removeErc721Contract } from '../migration-helpers';

const ROHKI_VROOM: NftFactory = {
  address: '0x317394c6dFB5606c2917E1a0DAD4f1B70EDDC921',
  startingBlock: '15112828',
  platformId: 'rohki',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
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
  await addErc721Contract(knex, ROHKI_VROOM)
}

export const down = async (knex: Knex) => {
  await removeErc721Contract(knex, ROHKI_VROOM);
}
