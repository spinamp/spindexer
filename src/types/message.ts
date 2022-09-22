

import { Table } from '../db/db';

export enum CrdtOperation {
  UPSERT = 'upsert',
  UPDATE = 'update'
} 

export type CrdtMessage = {
  id?: string;
  timestamp: Date;
  table: Table,
  data: {
    [column: string]: string
  }
  operation: CrdtOperation
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

export function getCrdtUpdateMessage<T>(table: Table, data: PartialValues<T>): CrdtUpdateMessage{
  return {
    timestamp: new Date(),
    table,
    data,
    operation: CrdtOperation.UPDATE
  }
}

export function getCrdtUpsertMessages<T>(table: Table, id: string, data: Values<T> ): CrdtUpsertMessage {
  const time = new Date();
  return {
    timestamp: time,
    table,
    data: data,
    operation: CrdtOperation.UPSERT
  }
}
