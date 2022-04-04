import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const zoraNotCatalog: Trigger<Clients, undefined> = async (clients: Clients) => {
  throw new Error('Not yet implemented');
};
