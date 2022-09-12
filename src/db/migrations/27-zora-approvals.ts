import { Knex } from 'knex';

import { CrdtMessage, getCrdtUpdateMessages } from '../../types/message';
import { NFT, NftFactory } from '../../types/nft';
import { Table } from '../db';

async function delay(callback: any, timeout: number){
  return new Promise((res) => {
    setTimeout(() => {
      res(callback())
    }, timeout )
  })
}

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
      } ,
      approved: false
    })
  ]


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
