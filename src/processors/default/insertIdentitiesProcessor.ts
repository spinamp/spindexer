
import { Table } from '../../db/db';
import { newIdentities } from '../../triggers/identities';
import { Identity } from '../../types/identity';
import { Clients, Processor } from '../../types/processor';

const NAME = 'insertIdentites'

export const insertIdentities: Processor = {

  name: NAME,
  trigger: newIdentities,
  processorFunction: async (identities: Identity[] , clients: Clients) => {
    await clients.db.insert<Identity>(Table.identities, identities)
  },
  initialCursor: undefined
};
