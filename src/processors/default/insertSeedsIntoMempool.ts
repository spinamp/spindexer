
import { Table } from '../../db/db';
import { newMessages } from '../../triggers/messages';
import { CrdtMessage } from '../../types/message';
import { Clients, Processor } from '../../types/processor';

const NAME = 'insertSeedsIntoMempool'

export const insertSeedsIntoMempool: Processor = {

  name: NAME,
  trigger: newMessages,
  processorFunction: async ({ items, newCursor }: { items: CrdtMessage[], newCursor: string } , clients: Clients) => {
    await clients.db.insert(Table.mempool, items)
    await clients.db.updateProcessor(NAME, newCursor)
  },
  initialCursor: '0'
};
