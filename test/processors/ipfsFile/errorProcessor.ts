

import assert from 'assert';

import { DBClient, Table } from '../../../src/db/db';
import db from '../../../src/db/sql-db';
import { ipfsFileErrorRetry } from '../../../src/processors/ipfsFile/errorProcessor';
import { initClients } from '../../../src/runner';
import { IPFSFile } from '../../../src/types/ipfsFile';
import { Clients } from '../../../src/types/processor';
import { truncateDB } from '../../helpers'


describe('ipfsFileErrorRetry', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  const tenMinsAgo = new Date(new Date().getTime() - 600000)
  const oneDayAgo = new Date(new Date().getTime() - 86400000)
  const originalMaxRetries = process.env.NUMBER_OF_ERROR_RETRIES!;
  const maxRetries = '5';
  const originalQueryTriggerMax = process.env.QUERY_TRIGGER_BATCH_SIZE!;
  const queryTriggerMax = '10';

  const ipfsFiles: IPFSFile[] = [
    { url: 'https://spinamp.xyz/1xx', error: 'nope' },
    { url: 'https://spinamp.xyz/2xx', error: 'nope', lastRetry: tenMinsAgo, numberOfRetries: 1 },
    { url: 'https://spinamp.xyz/3xx', error: 'nope', lastRetry: tenMinsAgo, numberOfRetries: 3 }, // skipped when retries exceeds exponential backoff
    { url: 'https://spinamp.xyz/4xx', error: 'nope', lastRetry: oneDayAgo, numberOfRetries: 5 }, // skipped when retries at maximum
    { url: 'https://spinamp.xyz/5xx', error: 'nope', mimeType: 'audio/mpeg', cid: '5xx' }, // skipped when mimetype and cid not null
  ]

  const setupFixtures = async () => {
    await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
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

    it ('returns ipfsFiles with errors', async () => {
      const result: any = await ipfsFileErrorRetry.trigger(clients, undefined);

      assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
      assert(result[0].url === 'https://spinamp.xyz/1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      assert(result[1].url === 'https://spinamp.xyz/2xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
    });
  })

  describe('processor', async () => {
    beforeEach( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    })

    it('clears the error, increments the retry, and sets lastRetry', async () => {
      const triggerItems = await ipfsFileErrorRetry.trigger(clients, undefined);
      await ipfsFileErrorRetry.processorFunction(triggerItems, clients);

      const files: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['url', 'like', '%1xx%']]]);
      assert(files[0].url === 'https://spinamp.xyz/1xx', `incorrect row returned, file was ${JSON.stringify(files[0])}`);
      assert(files[0].error === null, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
      assert(files[0].numberOfRetries === 1, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
      assert(!!files[0].lastRetry, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
    });
  });
})
