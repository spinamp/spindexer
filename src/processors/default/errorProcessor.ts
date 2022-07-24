import { Table } from '../../db/db';
import { errorRetry } from '../../triggers/errors';
import { ERC721NFTProcessError } from '../../types/erc721nftProcessError';
import { Clients, Processor } from '../../types/processor';

export const errorProcessor: Processor = {
  
  name: 'errorProcessor',
  trigger: errorRetry,
  processorFunction: async (nftErrors: ERC721NFTProcessError[], clients: Clients) => {
    const nftUpdates: ERC721NFTProcessError[] = nftErrors.map((n) => ({
      erc721nftId: n.erc721nftId,
      metadataError: undefined,
      processError: undefined,
      numberOfRetries: n.numberOfRetries + 1,
      lastRetry: new Date()
    }));
    await clients.db.upsert(Table.erc721nftProcessErrors, nftUpdates, 'erc721nftId');
  },
  initialCursor: undefined
};
