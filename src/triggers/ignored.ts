import { ignoredNFTIds } from '../constants/ignoredNFTIds';
import { Clients } from '../types/processor';
import { Cursor, Trigger } from '../types/trigger';

export const ignoredNFTs: Trigger<Cursor> = async (clients, cursor) => {
  if (cursor === 'true') {
    return [];
  }
  return ignoredNFTIds;
};
