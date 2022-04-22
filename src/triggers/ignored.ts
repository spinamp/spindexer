import { ignoredNFTIds } from '../constants/ignoredNFTIds';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const ignoredNFTs: Trigger<Clients, string> = async (clients: Clients, cursor: string) => {
  if(cursor === 'true') {
    return [];
  }
  return ignoredNFTIds;
};
