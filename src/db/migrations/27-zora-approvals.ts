import { Knex } from 'knex';

import { getCrdtUpdateMessages } from '../../types/message';
import { NftFactory } from '../../types/nft';
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
  const messages = [
    ...getCrdtUpdateMessages<NftFactory>(Table.nftFactories, {
      id: '0x78fb0b8d4502ae69a61c0d0321141629553472bd',
      approved: false,
      autoApprove: true
    })
  ]

  // add delay to get newer timestamp for testing
  await delay(() => {
    const message = getCrdtUpdateMessages<NftFactory>(Table.nftFactories, {
      id: '0x78fb0b8d4502ae69a61c0d0321141629553472bd',
      approved: true,
    })
    messages.push(...message);
  }, 1500)

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
