import { ignoredNFTIds } from '../constants/ignoredNFTIds';
import { Clients } from '../types/processor';
import { Cursor, Trigger } from '../types/trigger';

export const ignoredNFTs: Trigger<Cursor> = async (clients: Clients, cursor: string) => {
  if (cursor === 'true') {
    return [];
  }
  return ignoredNFTIds;
};
