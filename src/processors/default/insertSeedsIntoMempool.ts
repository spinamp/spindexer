
import { Table } from '../../db/db';
import { newSeedMessages } from '../../triggers/messages';
import { CrdtMessage } from '../../types/message';
import { Clients, Processor } from '../../types/processor';

const NAME = 'insertSeedsIntoMempool'

export const insertSeedsIntoMempool: Processor = {

  name: NAME,
  trigger: newSeedMessages,
  processorFunction: async ({ items, newCursor }: { items: CrdtMessage[], newCursor: string } , clients: Clients) => {
    await clients.db.insert(Table.mempool, items)
    await clients.db.updateProcessor(NAME, newCursor)
  },
  initialCursor: '0'
};
