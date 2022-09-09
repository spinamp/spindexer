import _ from 'lodash';

import { Table } from '../../db/db';
import { fromDBRecord } from '../../db/orm';
import { pendingMempoolInsertMessages, pendingMempoolUpdateMessages } from '../../triggers/messages';
import { PendingMempoolMessage, CrdtInsertMessage, CrdtUpdateMessage, CrdtInsertState, CrdtUpdateState } from '../../types/message';
import { Clients, Processor } from '../../types/processor';

function categorizeMessages<MessageType extends CrdtInsertMessage | CrdtUpdateMessage, CrdtStateType extends CrdtInsertState | CrdtUpdateState>
(
  messages: PendingMempoolMessage<MessageType>[],
  messageGrouper: (message: MessageType) => string,
  mapMessage: (message: MessageType) => { [column: string]: string },
  mapCrdtState: (message: MessageType) => CrdtStateType,
):
  { results: any, crdtUpdates: CrdtStateType[] } {
  const entityUpdates: { [id: string]: any } = {};
  const crdtUpdates: CrdtStateType[] = [];

  // group by table, column, entity so that we can easily categorize fresh and stale messages.
  // messages within each group are ordered by timestamp in the trigger, so it's safe to assume 
  // the last message of each group is the freshest
  const groupedMessagesUpdates = _.groupBy(
    messages,
    messageGrouper
  );

  Object.values(groupedMessagesUpdates).forEach(groupedMessage => {
    // the last message in groupMessage is the freshest
    const freshestUpdate = groupedMessage.at(-1);
    if (!freshestUpdate) return;

    // if the freshest message is fresher than the last time from crdtState, we can process it
    // and update the crdt state.
    // otherwise we can discard the message
    if (freshestUpdate.lastTimestamp === null || freshestUpdate.timestamp > freshestUpdate.lastTimestamp){
      entityUpdates[freshestUpdate.entityId] = {
        ...entityUpdates[freshestUpdate.entityId],
        ...mapMessage(freshestUpdate)
      }

      crdtUpdates.push(mapCrdtState(freshestUpdate))
    }
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


function categorizeUpdateMessages(messages: PendingMempoolMessage<CrdtUpdateMessage>[]): { results: any, crdtUpdates: CrdtUpdateState[] } {
  const messageGrouper = (message: PendingMempoolMessage<CrdtUpdateMessage>) => `${message.operation}.${message.table}.${message.column}.${message.entityId}`
  const mapMessage = (message: PendingMempoolMessage<CrdtUpdateMessage>) => ({ [message.column]: message.value });
  const mapCrdtState = (message: PendingMempoolMessage<CrdtUpdateMessage>) => ({
    table: message.table,
    column: message.column,
    entityId: message.entityId,
    lastTimestamp: message.timestamp,
  })

  return categorizeMessages<PendingMempoolMessage<CrdtUpdateMessage>, CrdtUpdateState>(messages, messageGrouper, mapMessage, mapCrdtState)
}

function categorizeInsertMessages(messages: PendingMempoolMessage<CrdtInsertMessage>[]): { results: any, crdtUpdates: CrdtInsertState[] } {

  const messageGrouper = (message: PendingMempoolMessage<CrdtInsertMessage>) => `${message.operation}.${message.table}.${message.entityId}`
  const mapMessage = (message: PendingMempoolMessage<CrdtInsertMessage>) => ({ value: message.value });
  const mapCrdtState = (message: PendingMempoolMessage<CrdtInsertMessage>) => ({
    table: message.table,
    entityId: message.entityId,
    lastTimestamp: message.timestamp,
  })

  return categorizeMessages<PendingMempoolMessage<CrdtInsertMessage>, CrdtInsertState>(messages, messageGrouper, mapMessage, mapCrdtState)
}


export const processMempoolUpdates: (table: Table) => Processor = 
  (table) => ({

    name: 'processMempoolUpdates',
    trigger: pendingMempoolUpdateMessages(table),
    processorFunction: async (messages: PendingMempoolMessage<CrdtUpdateMessage>[] , clients: Clients) => {
      const { results, crdtUpdates } = categorizeUpdateMessages(messages);

      const rows = results.map((result: any) => fromDBRecord(result))

      await clients.db.update(table, rows);
      await clients.db.upsert(Table.crdtUpdateState, crdtUpdates, ['table', 'column', 'entityId'])
      await clients.db.delete(Table.mempool, messages.map(message => message.id))
    },
    initialCursor: undefined
  })

export const processMempoolInserts: (table: Table) => Processor = 
  (table) => ({
    name: 'processMempoolInserts',
    trigger: pendingMempoolInsertMessages(table),
    processorFunction: async (messages: PendingMempoolMessage<CrdtInsertMessage>[] , clients: Clients) => {
      const { crdtUpdates, results } = categorizeInsertMessages(messages);

      const insertResults: { id: string, value: any }[] = results;
      const rows = insertResults.map(result => JSON.parse(result.value));

      await clients.db.upsert(table, rows, undefined, undefined, true)
      await clients.db.upsert(Table.crdtInsertState, crdtUpdates, ['table', 'entityId'])
      await clients.db.delete(Table.mempool, messages.map(message => message.id))
    },
    initialCursor: undefined
  })