import { Knex } from 'knex';

import { CrdtMessage, getCrdtUpdateMessage } from '../../types/message';
import { NftFactory } from '../../types/nft';
import { Table } from '../db';

// approve zora factories from present-material
const pmRecords = [
  '0x78fb0b8d4502ae69a61c0d0321141629553472bd',
  '0x973aee1e38aafafb8a3c817117cf2ad43ab90ef7',
  '0x6bdc3155dd9535f002cd539e664c408ec42c060f',
  '0x3e28d99c9dff6f183e04a47ff82bdf83d6d07fbe',
  '0x423e2e4687a368b970c28ceec20448048b3ec8ab',
  '0x1495f8419c544071717375518b9dff1975d907fa',
  '0xc989ac6d12ec65650dffaad88cfb4bda261cc7fb',
  '0x173bf29946b6beac8ceac628bb65b5f8f13b8524',
  '0x6026a17d359a9b721f0709c963ad948db33f56dd',
  '0x970eeca75562ac20080459b16ea8ac1c54d6124b',
  '0x092882162387eaeace2d2f9d093f4f015ed73690',
  '0x54dab8d172b408a14fdb7991ebe243c27c7ef702',
  '0x06064b039c2a2096effc638b86f632327e91da0d',
  '0xa1b3920f56ac834b5d0b93b24378e609da2202af',
  '0x3aa59b2610ab3a94c52bd840ec753b01f6134bb1',
  '0x40b34c125a79c8dee404091ffb64ba2bd56348ce',
  '0x24271b4b616180e1a42bbeb93c75532ea34fd077',
  '0x4b29bbc353afa48c9d21716a3c051deb6a8145bd',
  '0x06ce5d865251d29b0957df602111970eb161ec6c',
  '0x14214694847ba90da2e9b08b6de397bd06d5a626',
  '0x676777d784ebcc9d3ff3e28ce73757864a8333b4']


export const up = async (knex: Knex) => {

  const messages: CrdtMessage[] = pmRecords.map(address =>
    getCrdtUpdateMessage<NftFactory>(Table.nftFactories, { id: address, approved: true, autoApprove: true })
  )

  for (const message of messages){
    await knex(Table.seeds).insert(message)
  }
}

export const down = async (knex: Knex) => {
  throw new Error('nope');
}
