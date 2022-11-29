import { Table } from '../../db/db';
import { errorRetry, soundPremintErrors } from '../../triggers/errors';
import { NFTProcessError } from '../../types/nftProcessError';
import { Clients, Processor } from '../../types/processor';

export const nftErrorProcessor: Processor = {
  name: 'nftErrorProcessor',
  trigger: errorRetry,
  processorFunction: async (nftErrors: NFTProcessError[], clients: Clients) => {
    const errorUpdates: NFTProcessError[] = nftErrors.map((n) => ({
      nftId: n.nftId,
      metadataError: undefined,
      processError: undefined,
      numberOfRetries: (n.numberOfRetries ?? 0) + 1,
      lastRetry: new Date()
    }));
    await clients.db.upsert(Table.nftProcessErrors, errorUpdates, 'nftId', undefined, true);
  },
  initialCursor: undefined
};

export const errorAndMetadataResetProcessor: Processor = {
  name: 'errorAndMetadataResetProcessor',
  trigger: soundPremintErrors,
  processorFunction: async (nftErrors: NFTProcessError[], clients: Clients) => {
    const nftUpdates = nftErrors.map(error => {
      return {
        id: error.nftId,
        metadata: null,
        tokenURI: null,
      }
    })
    const errorIds = nftErrors.map(e => e.nftId);
    await clients.db.update(Table.nfts, nftUpdates);
    await clients.db.delete(Table.nftProcessErrors, errorIds, 'nftId');
  },
  initialCursor: undefined
};
