import { Knex } from 'knex';

import { formatAddress } from '../../types/address';
import { ChainId, getFactoryId } from '../../types/chain';
import { CrdtOperation } from '../../types/message';
import { Table } from '../db';

const lensCurated = [
  '0x727Ce17C09a74292Eb1594f70e8f048402b6DC02',
  '0xACA5796A69B3baa43472cB17C1Cfc8bE1dd1B0d7',
  '0x569d90c20933812D3B79ed6Cef8315eEdb71c33A',
  '0x776612112BB1Ac43E19a9BF3399E37561B580101',
  '0x34ab5b4AAb5F59b48776399D14eAC920fE78DDFC',
  '0xab9758D94ff03d7a33feEE2E6eEE9B5B294b7d96',
  '0x40A0B627BE82Ea98d92B3f2F74AA6fFa565dBc6d',
  '0x6D8fAd98d452894F908B757F8b02A8793c4752DA',
  '0x9b0bafFe1FD4e1A5f35E1eFa119E09765223f8B2',
  '0x0a750ac994768fc76587116a4cd419ce25147b28',
  '0x9DbC8E829e7f3E3f244520Ba4089b8a620a51bDe',
  '0xb96080910b1F54cE6D6E3978e20bEeFb1642e15d',
  '0x155234631ed0728b5f2ca902f885a7fA3E7385bD',
  '0xF9564Bfd8F1A112668d96d389A20bd247f951071',
  '0x04d3D3418ceDcfA75374bAa1f2B8bDD0bb0d12DE',
  '0x728581b715d93B187b3AeF03a5BFD13b584A1624',
  '0x037bD83DC5c9C24c2407fdf5f7981bE888bbB89F',
  '0x8a697167a1039618fe4CA8A766fF8907C09fE39e',
  '0xea6D4d017aF8fE01371fcC34D48c6c5F35a8184C',
  '0x4BeC87F7Cb6A879d6398949E321DaA5D5B1e23F2',
  '0x6bBa1413154d4095BE1ec6cb79102F6AE297c38A',
  '0xD065759Da365f7050F279e3885cD26b03F26aF83',
  '0x07E1f947C27B310cFdd35fC6d8d8dAb0C0988a67',
  '0x31bbb1b15CD75d7E93D0355bc36F683E531dB984',
  '0x306F993424a71db639636540e430a2d38d8Dd0c0',
  '0x5da75875d5a2bf052e59e98f3e8ef63f6b6ed46a',
  '0xe9093e71acf40184d3c830b349a4d943aa7df2a5',
  '0x6d8fc3e018a4e7d976d5f42019195f3ad8ceba6b',
  '0x3b0cfa968ee8d83bc4c624cc907201ac55ccd816',
  '0xb96080910b1f54ce6d6e3978e20beefb1642e15d',
  '0x728581b715d93b187b3aef03a5bfd13b584a1624',
  '0x05705dbd97e7a27d78fe8a395305bd165e97314b',
  '0x8a697167a1039618fe4ca8a766ff8907c09fe39e',
  '0xea6d4d017af8fe01371fcc34d48c6c5f35a8184c',
  '0x155234631ed0728b5f2ca902f885a7fa3e7385bd',
  '0xf9564bfd8f1a112668d96d389a20bd247f951071',
  '0x31d993520f90b1b5acdbf62d610846f137a8e085',
  '0x037bd83dc5c9c24c2407fdf5f7981be888bbb89f',
  '0xab9758d94ff03d7a33feee2e6eee9b5b294b7d96',
  '0x40a0b627be82ea98d92b3f2f74aa6ffa565dbc6d',
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
