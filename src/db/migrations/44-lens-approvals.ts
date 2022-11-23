import { Knex } from 'knex';

import { formatAddress } from '../../types/address';
import { ChainId, getFactoryId } from '../../types/chain';
import { CrdtOperation } from '../../types/message';
import { Table } from '../db';

export const lensCurated = [
  '0x727ce17c09a74292eb1594f70e8f048402b6dc02',
  '0xaca5796a69b3baa43472cb17c1cfc8be1dd1b0d7',
  '0x569d90c20933812d3b79ed6cef8315eedb71c33a',
  '0x776612112bb1ac43e19a9bf3399e37561b580101',
  '0x34ab5b4aab5f59b48776399d14eac920fe78ddfc',
  '0xab9758d94ff03d7a33feee2e6eee9b5b294b7d96',
  '0x6d8fad98d452894f908b757f8b02a8793c4752da',
  '0x9b0baffe1fd4e1a5f35e1efa119e09765223f8b2',
  '0x0a750ac994768fc76587116a4cd419ce25147b28',
  '0x9dbc8e829e7f3e3f244520ba4089b8a620a51bde',
  '0xb96080910b1f54ce6d6e3978e20beefb1642e15d',
  '0x155234631ed0728b5f2ca902f885a7fa3e7385bd',
  '0xf9564bfd8f1a112668d96d389a20bd247f951071',
  '0x04d3d3418cedcfa75374baa1f2b8bdd0bb0d12de',
  '0x728581b715d93b187b3aef03a5bfd13b584a1624',
  '0x037bd83dc5c9c24c2407fdf5f7981be888bbb89f',
  '0x8a697167a1039618fe4ca8a766ff8907c09fe39e',
  '0xea6d4d017af8fe01371fcc34d48c6c5f35a8184c',
  '0x4bec87f7cb6a879d6398949e321daa5d5b1e23f2',
  '0x6bba1413154d4095be1ec6cb79102f6ae297c38a',
  '0xd065759da365f7050f279e3885cd26b03f26af83',
  '0x07e1f947c27b310cfdd35fc6d8d8dab0c0988a67',
  '0x31bbb1b15cd75d7e93d0355bc36f683e531db984',
  '0x306f993424a71db639636540e430a2d38d8dd0c0',
  '0x5da75875d5a2bf052e59e98f3e8ef63f6b6ed46a',
  '0xe9093e71acf40184d3c830b349a4d943aa7df2a5',
  '0x6d8fc3e018a4e7d976d5f42019195f3ad8ceba6b',
  '0x3b0cfa968ee8d83bc4c624cc907201ac55ccd816',
  '0x05705dbd97e7a27d78fe8a395305bd165e97314b',
  '0x31d993520f90b1b5acdbf62d610846f137a8e085',
];

export const up = async (knex: Knex) => {
  const messages: any[] = lensCurated.map(address => ({
    timestamp: new Date(),
    table: Table.nftFactories,
    data: {
      id: getFactoryId(ChainId.polygon, formatAddress(address)),
      approved: true,
      autoApprove: true,
    },
    operation: CrdtOperation.UPDATE,
  }));

  for (const message of messages) {
    await knex(Table.seeds).insert(message);
  }
};

export const down = async (knex: Knex) => {
  throw new Error('nope');
};
