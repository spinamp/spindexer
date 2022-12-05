import assert from 'assert';

import { DBClient, Table } from '../../../src/db/db';
import db from '../../../src/db/sql-db';
import { ipfsFileSyncExistingPinsProcessor } from '../../../src/processors/ipfsFile/syncExistingPinsProcessor';
import { initClients } from '../../../src/runner';
import { IPFSFile } from '../../../src/types/ipfsFile';
import { Clients } from '../../../src/types/processor';
import { ProcessedTrack } from '../../../src/types/track';
import { truncateDB } from '../../helpers'


describe('ipfsFileSyncExistingPinsProcessor', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  const ipfsFiles: IPFSFile[] = [
    { url: 'https://spinamp.xyz/2xx', cid: '2xx' },
    { url: 'https://spinamp.xyz/3xx', cid: '3xx', error: 'nope' },
  ]

  const processedTracks: Partial<ProcessedTrack>[] = [
    { id: '11', lossyArtworkIPFSHash: '1xx', lossyArtworkURL: 'https://spinamp.xyz/1xx' },
    { id: '22', lossyArtworkIPFSHash: '2xx', lossyArtworkURL: 'https://spinamp.xyz/2xx' }, // skipped (already in ipfsFiles)
    { id: '33', lossyArtworkIPFSHash: '3xx', lossyArtworkURL: 'https://spinamp.xyz/3xx' }, // skipped (has an error)
    { id: '44', lossyArtworkIPFSHash: '4xx', lossyArtworkURL: 'https://spinamp.xyz/4xx' },
  ]

  const setupFixtures = async () => {
    await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
    await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
  };

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  describe('trigger', async () => {
    beforeEach( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    });

    it ('returns ipfsFiles', async () => {
      const result: any = await ipfsFileSyncExistingPinsProcessor.trigger(clients, undefined);

      assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
      assert(result[0].lossyArtworkURL === 'https://spinamp.xyz/1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      assert(result[1].lossyArtworkURL === 'https://spinamp.xyz/4xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
    });
  })

  describe('processor', async () => {
    beforeEach( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    })

    it('adds the missing ipfs file', async () => {
      const triggerItems = await ipfsFileSyncExistingPinsProcessor.trigger(clients, undefined);
      await ipfsFileSyncExistingPinsProcessor.processorFunction(triggerItems, clients);

      const file1: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['url', 'like', '%1xx%']]]);
      assert(file1[0].url === 'https://spinamp.xyz/1xx', `incorrect row returned, file was ${JSON.stringify(file1[0])}`);
      assert(file1[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(file1[0])}`);

      const file4: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['url', 'like', '%4xx%']]]);
      assert(file4[0].url === 'https://spinamp.xyz/4xx', `incorrect row returned, file was ${JSON.stringify(file4[0])}`);
      assert(file4[0].cid === '4xx', `incorrect row returned, file was ${JSON.stringify(file4[0])}`);
    });
  });
})
