import { hrtime } from 'node:process';

import { Table } from '../../db/db';
import { newMessages } from '../../triggers/messages';
import { CrdtMessage, ProcessedMessage } from '../../types/message';
import { Clients, Processor } from '../../types/processor';


const NAME = 'messageProcessor'

export const crdtMessageProcessor: Processor = {

  name: NAME,
  trigger: newMessages,
  // recieves messages in order of timestamp
  // messages older than what has already been processed should not be included
  processorFunction: async (crdtMessages: CrdtMessage[] , clients: Clients) => {
    const processedMessages: ProcessedMessage[] = []

    // process messages
    for (const message of crdtMessages){
      await clients.db.upsert(message.table, [{
        id: message.entityId,
        [message.column]: message.value
      }])
      processedMessages.push({
        messageId: message.timestamp,
        table: message.table,
        column: message.column,
        entityId: message.entityId,
        processedAt: hrtime.bigint().toString(),
      })
    }

    // update processed messages table
    await clients.db.insert(Table.processedMessages, processedMessages)
  },
  initialCursor: undefined
};
