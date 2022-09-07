

import _ from 'lodash';

import { Table } from '../../db/db';
import { pendingMempoolInsertMessages, pendingMempoolUpdateMessages } from '../../triggers/messages';
import { CrdtState, PendingMempoolMessage } from '../../types/message';
import { Clients, Processor } from '../../types/processor';

function categorizeMessages(messages: PendingMempoolMessage[]): { results: any, crdtUpdates: CrdtState[] } {
  const entityUpdates: { [id: string]: any } = {};
  const crdtUpdates: CrdtState[] = [];

  // group by table, column, entity so that we can easily categorize fresh and stale messages.
  // messages within each group are ordered by timestamp in the trigger, so it's safe to assume 
  // the last message of each group is the freshest
  const groupedMessagesUpdates = _.groupBy(
    messages,
    message => `${message.operation}.${message.table}.${message.column}.${message.entityId}`
  );

  Object.values(groupedMessagesUpdates).forEach(groupMessage => {
    // the last message in groupMessage is the freshest
    const freshestUpdate = groupMessage.at(-1);
    if (!freshestUpdate) return;

    // if the freshest message is fresher than the last time from crdtState, we can process it
    // and update the crdt state.
    // otherwise we can discard the message
    if (freshestUpdate?.lastTimestamp === null || freshestUpdate?.timestamp > freshestUpdate?.lastTimestamp){
      entityUpdates[freshestUpdate.entityId] = {
        ...entityUpdates[freshestUpdate.entityId],
        [freshestUpdate.column]: freshestUpdate.value
      }

      crdtUpdates.push({
        table: freshestUpdate.table,
        column: freshestUpdate.column,
        entityId: freshestUpdate.entityId,
        lastTimestamp: freshestUpdate.timestamp,
      })
    }
  })
    
  const objectUpdates = Object.keys(entityUpdates).map(key => ({
    id: key,
    ...entityUpdates[key]
  }))

  return {
    results: objectUpdates,
    crdtUpdates,
  }
}

export const processMempoolUpdates: (table: Table) => Processor = 
  (table) => ({

    name: 'processMempoolUpdates',
    trigger: pendingMempoolUpdateMessages(table),
    processorFunction: async (messages: PendingMempoolMessage[] , clients: Clients) => {
      const { results, crdtUpdates } = categorizeMessages(messages);

      await clients.db.update(table, results);
      await clients.db.upsert(Table.crdtState, crdtUpdates, ['table', 'column', 'entityId'])
      await clients.db.delete(Table.mempool, messages.map(message => message.id))
    },
    initialCursor: undefined
  })

export const processMempoolInserts: (table: Table) => Processor = 
  (table) => ({

    name: 'processMempoolInserts',
    trigger: pendingMempoolInsertMessages(table),
    processorFunction: async (messages: PendingMempoolMessage[] , clients: Clients) => {
      const { crdtUpdates, results } = categorizeMessages(messages);

      const insertResults: { id: string, insert: string }[] = results;
      const rows = Object.values(insertResults).map(result => JSON.parse(result.insert));

      await clients.db.insert(table, rows)
      await clients.db.insert(Table.crdtState, crdtUpdates)
      await clients.db.delete(Table.mempool, messages.map(message => message.id))
    },
    initialCursor: undefined
  })
