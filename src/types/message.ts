
import { hrtime } from 'node:process';

import { Table } from '../db/db';

export type CrdtMessage = {
  timestamp: string;
  entityId: string;
  table: Table;
  column: string;
  value: string;
}

export type ProcessedMessage = {
  messageId: string;
  table: Table;
  column: string;
  entityId: string;
  processedAt: string;
}

type Values<T> = {
  id: string;
} & Partial<T>

export function getCrdtUpdateMessages<T>(table: Table, values: Values<T>): CrdtMessage[]{
  const messages: CrdtMessage[] = Object.keys(values).filter(key => key !== 'id').map(key => ({
    timestamp: hrtime.bigint().toString(),
    entityId: values.id,
    table,
    column: key,
    value: (values as any)[key]
  }))

  return messages
}