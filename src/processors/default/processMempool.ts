

import _ from 'lodash';

import { Table } from '../../db/db';
import { pendingMempoolMessages } from '../../triggers/messages';
import { CrdtOperation, CrdtState, MempoolMessage, PendingMempoolMessage } from '../../types/message';
import { Clients, Processor } from '../../types/processor';

export const processMempool: (table: Table) => Processor = 
  (table) => ({

    name: 'processMempool',
    trigger: pendingMempoolMessages(table),
    processorFunction: async (messages: PendingMempoolMessage[] , clients: Clients) => {
      // ignore inserts for now
      const staleMessages: MempoolMessage[] = messages.filter(message => message.operation === CrdtOperation.INSERT);

      // messages are ordered by timestamp.
      //  group by table, column, entity so that we can easily categorize fresh and stale messages
      const groupedMessagesUpdates = _.groupBy(
        messages.filter(message => message.operation === CrdtOperation.UPDATE),
        message => `${message.operation}.${message.table}.${message.column}.${message.entityId}`
      );
      const entityUpdates: { [id: string]: { [column: string]: string } } = {};
      const crdtUpdates: CrdtState[] = [];

      Object.values(groupedMessagesUpdates).forEach(groupMessage => {
        // gets the freshest message out of the mempool
        const freshestUpdate = groupMessage.pop()!;

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
        } else {
          staleMessages.push(freshestUpdate);
        }
        staleMessages.push(...groupMessage)
      })
    
      const objectUpdates = Object.keys(entityUpdates).map(key => ({
        id: key,
        ...entityUpdates[key]
      }))

      await clients.db.update(table, objectUpdates);
      await clients.db.upsert(Table.crdtState, crdtUpdates, ['table', 'column', 'entityId'])
      await clients.db.delete(Table.mempool, staleMessages.map(message => message.id.toString()))
    },
    initialCursor: undefined
  })

