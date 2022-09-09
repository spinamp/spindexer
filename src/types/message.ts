

import { Table } from '../db/db';

export enum CrdtOperation {
  INSERT = 'insert',
  UPDATE = 'update'
} 

export type CrdtMessage = {
  id?: string;
  timestamp: Date;
  table: Table,
  entityId: string;
  value: string;
  operation: CrdtOperation
}

export type CrdtInsertMessage = CrdtMessage & {
  operation: CrdtOperation.INSERT
}
export type CrdtUpdateMessage = CrdtMessage & {
  column: string;
  operation: CrdtOperation.UPDATE
}

export type MempoolMessage<T extends CrdtInsertMessage | CrdtUpdateMessage> = T & {
  id: number;
}

export type PendingMempoolMessage<T extends CrdtInsertMessage | CrdtUpdateMessage> = MempoolMessage<T> & {
  lastTimestamp: Date;
}

export type CrdtState = {
  table: Table;
  entityId: string;
  lastTimestamp: Date;
}

export type CrdtUpdateState = CrdtState & {
  column: string;
}

export type CrdtInsertState = CrdtState;

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

export function getCrdtInsertMessages<T>(table: Table, id: string, data: T ): CrdtInsertMessage{
  return {
    timestamp: new Date(),
    entityId: id,
    table,
    value: JSON.stringify(data),
    operation: CrdtOperation.INSERT
  }
}
