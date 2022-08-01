import { Table } from '../../db/db';
import { errorRetry } from '../../triggers/errors';
import { NFTProcessError } from '../../types/nftProcessError';
import { Clients, Processor } from '../../types/processor';

export const errorProcessor: Processor = {

  name: 'errorProcessor',
  trigger: errorRetry,
  processorFunction: async (nftErrors: NFTProcessError[], clients: Clients) => {
    const nftUpdates: NFTProcessError[] = nftErrors.map((n) => ({
      nftId: n.nftId,
      metadataError: undefined,
      processError: undefined,
      numberOfRetries: (n.numberOfRetries ?? 0) + 1,
      lastRetry: new Date()
    }));
    await clients.db.upsert(Table.nftProcessErrors, nftUpdates, 'nftId');
  },
  initialCursor: undefined
};
