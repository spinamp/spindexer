import assert from 'assert';

import MockAdapter from 'axios-mock-adapter';

import { DBClient, Table } from '../../src/db/db';
import { ipfsMimeTypeProcessor } from '../../src/processors/ipfsFile/mimeTypeProcessor';
import { initClients } from '../../src/runner';
import { IPFSFile } from '../../src/types/ipfsFile';
import { MimeEnum } from '../../src/types/media';
import { Clients } from '../../src/types/processor';
import { truncateDB } from '../helpers'

import db from './../../src/db/sql-db';

describe('ipfsMimeTypeProcessor', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  const ipfsFiles: IPFSFile[] = [
    { url: 'https://spinamp.xyz/1xx', cid: '1xx' },
    { url: 'https://spinamp.xyz/2xx', cid: undefined }, // skips undefined
    { url: 'https://spinamp.xyz/3xx', cid: '3xx', mimeType: 'image/jpeg' }, // skips existing
    { url: 'https://spinamp.xyz/4xx', cid: '4xx', error: 'nope' }, // skips errors
    { url: 'https://spinamp.xyz/5xx', cid: '5xx', mimeType: 'image/jpg', error: 'nope' }, // skips with mimeType and errors
    { url: 'https://spinamp.xyz/6xx', cid: '6xx' }, // skips unpinned
  ]

  const ipfsPins: any[] = [
    { id: '1xx', requestId: 'abc' },
    { id: '3xx', requestId: 'abc' },
    { id: '4xx', requestId: 'abc' },
    { id: '5xx', requestId: 'abc' },
  ]

  const setupFixtures = async () => {
    await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
    await dbClient.insert(Table.ipfsPins, ipfsPins);
  };

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  describe('trigger', async () => {
    before( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    })

    it('trigger returns pinned ipfs files without a mime type', async () => {
      const result: any = await ipfsMimeTypeProcessor.trigger(clients, undefined);

      assert(result.length === 1, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
      assert(result[0].cid === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
    });
  });

  describe('processor', async () => {
    beforeEach( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    })

    it('errors when a timeout happens', async () => {
      const mock = new MockAdapter(clients.axios as any);
      mock.onHead(/\/1xx/).timeout();

      const triggerItems = await ipfsMimeTypeProcessor.trigger(clients, undefined);
      await ipfsMimeTypeProcessor.processorFunction(triggerItems, clients);

      const files: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['url', 'like', '%1xx%']]]);
      assert(files[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(files[0])}`);
      assert(files[0].mimeType === null, `data should not be set on file: ${JSON.stringify(files[0])}`);
      assert(files[0].error === 'Error: failed to fetch mime type for ipfs hash: 1xx with error: timeout of 10000ms exceeded', `incorrect data was set on file: ${JSON.stringify(files[0])}`);
    });

    it('errors when returning a 400', async () => {
      const mock = new MockAdapter(clients.axios as any);
      mock.onHead(/\/1xx/).reply(400);

      const triggerItems = await ipfsMimeTypeProcessor.trigger(clients, undefined);
      await ipfsMimeTypeProcessor.processorFunction(triggerItems, clients);

      const files: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['url', 'like', '%1xx%']]]);
      assert(files[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(files[0])}`);
      assert(files[0].mimeType === null, `data should not be set on file: ${JSON.stringify(files[0])}`);
      assert(files[0].error === 'Error: failed to fetch mime type for ipfs hash: 1xx with error: Request failed with status code 400', `incorrect data was set on file: ${JSON.stringify(files[0])}`);
    });

    it('errors when mime type is not valid', async () => {
      const mock = new MockAdapter(clients.axios as any);
      mock.onHead(/\/1xx/).reply(200, {}, { 'content-type': 'application/binary' });

      const triggerItems = await ipfsMimeTypeProcessor.trigger(clients, undefined);
      await ipfsMimeTypeProcessor.processorFunction(triggerItems, clients);

      const files: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['url', 'like', '%1xx%']]]);
      assert(files[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(files[0])}`);
      assert(files[0].mimeType === null, `data should not be set on file: ${JSON.stringify(files[0])}`);
      assert(files[0].error === 'Error: unsupported mime type \'application/binary\' for ipfs hash: 1xx', `incorrect data was set on file: ${JSON.stringify(files[0])}`);
    });

    it('adds mime type to file when response is valid', async () => {
      const mock = new MockAdapter(clients.axios as any);
      mock.onHead(/\/1xx/).reply(200, {}, { 'content-type': MimeEnum.jpg });

      const triggerItems = await ipfsMimeTypeProcessor.trigger(clients, undefined);
      await ipfsMimeTypeProcessor.processorFunction(triggerItems, clients);

      const files: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['url', 'like', '%1xx%']]]);
      assert(files[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(files[0])}`);
      assert(files[0].mimeType === MimeEnum.jpg, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
      assert(files[0].isImage === true, `incorrect data was set on file: ${JSON.stringify(files[0])}`);
    });
  });
})
