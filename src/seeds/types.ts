import { Request } from 'express';

import { Table } from '../db/db';
import { EthereumAddress } from '../types/ethereum';
import { CrdtOperation, CrdtUpdateMessage } from '../types/message'


export type AuthRequest = Request & {
  signer?: string;
}

export const AdminOperations = CrdtOperation;
export enum PublicOperations { CONTRACT_APPROVAL = 'contractApproval' }

export const AllApiOperations = { ...AdminOperations, ...PublicOperations }
type AllowedApiOperations = CrdtOperation | PublicOperations;

export enum CrdtEntities {
  'platforms',
  'nftFactories',
  'artists',
  'processedTracks'
}
type CrdtEntity = keyof typeof CrdtEntities;

export type MessagePayload = {
  entity: CrdtEntity,
  operation: AllowedApiOperations,
  data: any,
  signer: EthereumAddress,
}

export const getCrdtContractApprovalMessage = (_table: any, data: any, signer: EthereumAddress): CrdtUpdateMessage => {
  return {
    timestamp: new Date(),
    table: Table.nftFactories,
    data,
    operation: CrdtOperation.UPDATE,
    signer: signer.toLowerCase(),
  }
}
