
// import { Knex } from 'knex';

import { Knex } from 'knex'

// import { approveNftFactory, revokeNftFactoryApproval } from '../migration-helpers';

// import { CATALOG, NOIZD } from './02-insert-nft-factories';
// import { HEDSTAPE_1, HEDSTAPE_2, HEDSTAPE_3, HEDSTAPE_4 } from './04-add-heds';
// import { OTHERSIDE } from './14-add-hume-angelbaby-otherside';
// import { VIEW_FROM_THE_MOON } from './15-add-view-from-the-moon';
// import { MINTED } from './16-add-angelbaby-minted';

// const approvedNftFactories = [
//   NOIZD,
//   CATALOG,
//   HEDSTAPE_1,
//   HEDSTAPE_2,
//   HEDSTAPE_3,
//   HEDSTAPE_4,
//   OTHERSIDE,
//   VIEW_FROM_THE_MOON,
//   MINTED,
// ]

export const up = async (knex: Knex) => {

  // for (const factory of approvedNftFactories){
  //   await approveNftFactory(knex, factory);
  // }

}

export const down = async (knex: Knex) => {
 
  // for (const factory of approvedNftFactories){
  //   await revokeNftFactoryApproval(knex, factory);
  // }

}
