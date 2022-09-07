

import { Table } from '../db/db';

export enum CrdtOperation {
  INSERT = 'insert',
  UPDATE = 'update'
} 

export type CrdtMessage = {
  id?: string;
  timestamp: Date;
  table: Table,
  column: string;
  entityId: string;
  value: string;
  operation: CrdtOperation
}

export type MempoolMessage = CrdtMessage & {
  id: number;
}

export type PendingMempoolMessage = MempoolMessage & {
  lastTimestamp: Date;
}

export type CrdtState = {
  table: Table;
  column: string;
  entityId: string;
  lastTimestamp: Date;
}

type Values<T> = {
  id: string;
} & Partial<T>

export function getCrdtUpdateMessages<T>(table: Table, values: Values<T>): CrdtMessage[]{
  const messages: CrdtMessage[] = Object.keys(values).filter(key => key !== 'id').map(key => ({
    timestamp: new Date(),
    entityId: values.id,
    table,
    column: key,
    value: (values as any)[key],
    operation: CrdtOperation.UPDATE
  }))

  return messages
}

export function getCrdtInsertMessages<T>(table: Table, id: string, data: T ): CrdtMessage{
  return {
    timestamp: new Date(),
    entityId: id,
    table,
    column: 'insert',
    value: JSON.stringify(data),
    operation: CrdtOperation.INSERT
  }
}
