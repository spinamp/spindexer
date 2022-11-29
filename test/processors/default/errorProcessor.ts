

import assert from 'assert';

import { DBClient, Table } from '../../../src/db/db';
import db from '../../../src/db/sql-db';
import { nftErrorProcessor } from '../../../src/processors/default/errorProcessor';
import { initClients } from '../../../src/runner';
import { IPFSFile } from '../../../src/types/ipfsFile';
import { NFT } from '../../../src/types/nft';
import { NFTProcessError } from '../../../src/types/nftProcessError';
import { Clients } from '../../../src/types/processor';
import { truncateDB } from '../../helpers'


describe('nftErrorProcessor', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  const tenMinsAgo = new Date(new Date().getTime() - 600000)
  const oneDayAgo = new Date(new Date().getTime() - 86400000)
  const originalMaxRetries = process.env.NUMBER_OF_ERROR_RETRIES!;
  const maxRetries = '5';
  const originalQueryTriggerMax = process.env.QUERY_TRIGGER_BATCH_SIZE!;
  const queryTriggerMax = '10';

  const nfts: Partial<NFT>[] = [
    { id: '1', contractAddress: 'x' },
    { id: '2', contractAddress: 'x' },
    { id: '3', contractAddress: 'x' },
    { id: '4', contractAddress: 'x' },
  ]

  const nftProcessErrors: NFTProcessError[] = [
    { nftId: '1', processError: 'nope' },
    { nftId: '2', metadataError: 'nope', lastRetry: tenMinsAgo, numberOfRetries: 1 },
    { nftId: '3', processError: 'nope', lastRetry: tenMinsAgo, numberOfRetries: 3 }, // skipped when retries exceeds exponential backoff
    { nftId: '4', processError: 'nope', lastRetry: oneDayAgo, numberOfRetries: 5 }, // skipped when retries at maximum
  ]

  const setupFixtures = async () => {
    await dbClient.insert<Partial<NFT>>(Table.nfts, nfts);
    await dbClient.insert<Partial<IPFSFile>>(Table.nftProcessErrors, nftProcessErrors);
  };

  before( async () => {
    process.env.NUMBER_OF_ERROR_RETRIES = maxRetries;
    process.env.QUERY_TRIGGER_BATCH_SIZE = queryTriggerMax;
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  after(() => {
    process.env.NUMBER_OF_ERROR_RETRIES = originalMaxRetries;
    process.env.QUERY_TRIGGER_BATCH_SIZE = originalQueryTriggerMax;
  })

  describe('trigger', async () => {
    beforeEach( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    });

    it ('returns nftProcessErrors due to be retried', async () => {
      const result: any = await nftErrorProcessor.trigger(clients, undefined);

      assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
      assert(result[0].nftId === '1', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      assert(result[1].nftId === '2', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
    });
  })

  describe('processor', async () => {
    beforeEach( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    })

    it('clears the errors, increments the retry, and sets lastRetry', async () => {
      const triggerItems = await nftErrorProcessor.trigger(clients, undefined);
      await nftErrorProcessor.processorFunction(triggerItems, clients);

      const files: any = await dbClient.getRecords(Table.nftProcessErrors, [['where', ['nftId', 'like', '1']]]);
      assert(files[0].nftId === '1', `incorrect row returned, file was ${JSON.stringify(files[0])}`);
      assert(files[0].metadataError === null, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
      assert(files[0].processError === null, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
      assert(files[0].numberOfRetries === 1, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
      assert(!!files[0].lastRetry, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
    });
  });
})
