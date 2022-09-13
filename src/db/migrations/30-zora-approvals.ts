import { Knex } from 'knex';

import { ETHEREUM_NULL_ADDRESS } from '../../types/ethereum';
import { CrdtMessage, getCrdtInsertMessage, getCrdtUpdateMessages } from '../../types/message';
import { NFT, NFTContractTypeName, NftFactory, NFTStandard } from '../../types/nft';
import { Table } from '../db';

export const up = async (knex: Knex) => {

  // approve zora factories
  const messages: CrdtMessage[] = [
    ...getCrdtUpdateMessages<NftFactory>(Table.nftFactories, {
      id: '0x78fb0b8d4502ae69a61c0d0321141629553472bd',
      approved: true,
    }),
    ...getCrdtUpdateMessages<NFT>(Table.nfts, {
      id: '0x3bf96afe2291d76f2934350624080faefeec9a46/6',
      createdAtEthereumBlockNumber: '8050',
      metadata: {
        test: 'boo'
      },
      approved: false
    })
  ]

  messages.push(
    getCrdtInsertMessage<NftFactory>(Table.nftFactories, ETHEREUM_NULL_ADDRESS,
      {
        id: ETHEREUM_NULL_ADDRESS,
        approved: false,
        autoApprove: false,
        contractType: NFTContractTypeName.default,
        platformId: 'zora',
        standard: NFTStandard.ERC721,
        
      })
  )

  messages.push(
    getCrdtInsertMessage<NftFactory>(Table.nftFactories, '0x0000000000000000000000000000000000000001',
      {
        id: '0x0000000000000000000000000000000000000001',
        approved: false,
        autoApprove: false,
        contractType: NFTContractTypeName.default,
        platformId: 'zora',
        standard: NFTStandard.ERC721,
        
      })
  )


  for (const message of messages){
    await knex(Table.seeds).insert(message)
  }
}

export const down = async (knex: Knex) => {


  // for (const address of factoriesToApprove){
  //   // await approveNftFactory(address)
  //   // todo: revoke approval
  // }
}
