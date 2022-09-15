

import { Table } from '../db/db';

export enum CrdtOperation {
  UPSERT = 'upsert',
  UPDATE = 'update'
} 

export type CrdtMessage = {
  id?: string;
  timestamp: Date;
  table: Table,
  entityId: string;
  column: string;
  value: string;
  operation: CrdtOperation
}

export type CrdtUpserttMessage = CrdtMessage & {
  operation: CrdtOperation.UPSERT
}
export type CrdtUpdateMessage = CrdtMessage & {
  operation: CrdtOperation.UPDATE
}

export type MempoolMessage = CrdtMessage & {
  id: number;
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

type Values<T> = {
  id: string;
} & Partial<T>

export function getCrdtUpdateMessages<T>(table: Table, values: Values<T>): CrdtUpdateMessage[]{
  const messages: CrdtUpdateMessage[] = Object.keys(values).filter(key => key !== 'id').map(key => ({
    timestamp: new Date(),
    entityId: values.id,
    table,
    column: key,
    value: (values as any)[key],
    operation: CrdtOperation.UPDATE
  }))

  return messages
}

export function getCrdtUpsertMessages<T extends object>(table: Table, id: string, data: T ): CrdtUpserttMessage[] {
  const time = new Date();
  const messages: CrdtUpserttMessage[] = Object.keys(data).filter(key => key !== 'id').map(key => ({
    timestamp: time,
    table,
    entityId: id,
    column: key,
    value: (data as any)[key],
    operation: CrdtOperation.UPSERT
  }));


  return messages;
}
