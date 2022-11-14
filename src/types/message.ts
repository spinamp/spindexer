

import { Table } from '../db/db';

import { EVMAddress } from './evm';

export enum CrdtOperation {
  UPSERT = 'upsert',
  UPDATE = 'update',
}

export type CrdtMessage = {
  id?: string;
  timestamp: Date;
  table: Table,
  data: {
    [column: string]: string
  }
  operation: CrdtOperation,
  signer: EVMAddress
}

export type CrdtUpsertMessage = CrdtMessage & {
  operation: CrdtOperation.UPSERT
}
export type CrdtUpdateMessage = CrdtMessage & {
  operation: CrdtOperation.UPDATE
}

export type MempoolMessage = {
  id: string;
  timestamp: Date;
  table: Table;
  column: string;
  entityId: string;
  value: string;
  operation: CrdtOperation
}

export type PendingMempoolMessage = MempoolMessage & {
  lastTimestamp: Date;
  lastValue: string;
}

export type CrdtState = {
  table: Table;
  entityId: string;
  column: string;
  value: string;
  lastTimestamp: Date;
}

type PartialValues<T> = {
  id: string;
} & Partial<T>


type Values<T> = {
  id: string;
} & T

export function getCrdtUpdateMessage<T>(table: Table, data: PartialValues<T>, signer: EVMAddress): CrdtUpdateMessage{
  return {
    timestamp: new Date(),
    table,
    data,
    operation: CrdtOperation.UPDATE,
    signer: signer.toLowerCase(),
  }
}
export function getCrdtUpsertMessage<T>(table: Table, data: Values<T>, signer: EVMAddress ): CrdtUpsertMessage {
  return {
    timestamp: new Date(),
    table,
    data,
    operation: CrdtOperation.UPSERT,
    signer: signer.toLowerCase(),
  }
}
