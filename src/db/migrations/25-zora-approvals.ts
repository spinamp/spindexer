import { Knex } from 'knex';

import { getCrdtUpdateMessages } from '../../types/message';
import { NftFactory } from '../../types/nft';
import { Table } from '../db';

export const up = async (knex: Knex) => {

  // approve zora factories
  const messages = getCrdtUpdateMessages<NftFactory>(Table.nftFactories, {
    id: '0x78fb0b8d4502ae69a61c0d0321141629553472bd',
    approved: true,
    autoApprove: true
  })

  for (const message of messages){
    await knex(Table.crdtMessages).insert(message)
  }
}

export const down = async (knex: Knex) => {


  for (const address of factoriesToApprove){
    // await approveNftFactory(address)
    // todo: revoke approval
  }
}
