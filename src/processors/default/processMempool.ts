import _ from 'lodash';

import { Table } from '../../db/db';
import { pendingMempoolInsertMessages, pendingMempoolUpdateMessages } from '../../triggers/messages';
import { PendingMempoolMessage, CrdtState } from '../../types/message';
import { Clients, Processor } from '../../types/processor';

function categorizeMessages
(
  messages: PendingMempoolMessage[],
):
  { results: any, crdtUpdates: CrdtState[] } {
  const entityUpdates: { [id: string]: any } = {};
  const crdtUpdates: CrdtState[] = [];

  // NOTE: messages can be partially processed. If a column in a message is stale, it will be ignored but the rest of the message
  // will still be processed. 

  // group by entity so that we can easily categorize fresh and stale messages.
  // messages within each group are ordered by timestamp in the trigger, so it's safe to assume 
  // the last message of each group is the freshest
  const groupedMessagesUpdates = _.groupBy(
    messages,
    message => `${message.operation}.${message.table}.${message.column}.${message.entityId}`
  );

  Object.values(groupedMessagesUpdates).forEach(groupedMessage => {
    // the last message in groupMessage is the freshest
    const freshestUpdate = groupedMessage.at(-1);
    if (!freshestUpdate) return;

    const conflictingMessages = groupedMessage.filter(message => message.timestamp.getTime() === freshestUpdate.timestamp.getTime());
    const sortedMessages = _.sortBy(conflictingMessages, 'value');
    const message = sortedMessages[0];
    
    // if the freshest message is fresher than the last time from crdtState, we can process it
    // and update the crdt state.
    // otherwise we can discard the message
    if (message.lastTimestamp > message.timestamp) return;

    if (message.timestamp.getTime() === message.lastTimestamp?.getTime()){
      // can discard if the last message is the same as the freshest message
      if (message.lastValue === message.value){
        return
      }

      const value = _.sortBy([message.value, message.lastValue])[0];

      // can discard if the last message value > freshest message value, due to the string ordering rule
      if (value === message.lastValue){
        return
      }
    }
    
    entityUpdates[freshestUpdate.entityId] = {
      ...entityUpdates[message.entityId],
      [message.column]: message.value
    }
    
    crdtUpdates.push({
      table: message.table,
      column: message.column,
      entityId: message.entityId,
      value: message.value,
      lastTimestamp: message.timestamp,
    })
  })
  
  const objectUpdates = Object.keys(entityUpdates).map(key => ({
    ...entityUpdates[key],
    id: key,
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

      const rows = results.map((result: any) => (result))

      await clients.db.update(table, rows);
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

      await clients.db.upsert(table, results)
      await clients.db.upsert(Table.crdtState, crdtUpdates, ['table', 'column', 'entityId'])
      await clients.db.delete(Table.mempool, messages.map(message => message.id))
    },
    initialCursor: undefined
  })
