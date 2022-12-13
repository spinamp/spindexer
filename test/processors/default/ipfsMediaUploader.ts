import assert from 'assert';

import sinon from 'sinon';

import { DBClient, Table } from '../../../src/db/db';
import db from '../../../src/db/sql-db';
import { ipfsMediaUploader } from '../../../src/processors/default/ipfsMediaUploader';
import { initClients } from '../../../src/runner';
import { IPFSFileUrl } from '../../../src/types/ipfsFile';
import { Clients } from '../../../src/types/processor';
import { ProcessedTrack } from '../../../src/types/track';
import { truncateDB } from '../../helpers'

describe('ipfsMediaUploader', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  describe('ipfsAudioUploader', async () => {
    const ipfsFilesUrls: IPFSFileUrl[] = [
      { url: 'https://spinamp.xyz/4xx', error: 'nope' },
    ]

    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11' }, // skipped (no cid, no url)
      { id: '22', lossyAudioIPFSHash: '2xx' }, // skipped (already has cid) [mintsongs/chaos example]
      { id: '33', lossyAudioIPFSHash: '3xx', lossyAudioURL: 'https://spinamp.xyz/3xx' }, // skipped (already uploaded)
      { id: '44', lossyAudioURL: 'https://spinamp.xyz/4xx' }, // skipped (error set on ipfsFilesUrls table)
      { id: '55', lossyAudioURL: 'https://spinamp.xyz/5xx' },
    ]

    const setupFixtures = async () => {
      await dbClient.insert<Partial<IPFSFileUrl>>(Table.ipfsFilesUrls, ipfsFilesUrls);
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
    };

    describe('trigger', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      });

      it ('returns ipfsFiles', async () => {
        const result: any = await ipfsMediaUploader('Audio').trigger(clients, undefined);

        assert(result.length === 1, `should only return 1 file based on test data, instead returned: ${ result.length > 0 ? JSON.stringify(result) : 'none' }`);
        assert(result[0].lossyAudioURL === 'https://spinamp.xyz/5xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      });
    })

    describe('processor', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      })

      afterEach(async () => {
        sinon.restore();
      })

      it('with a successful upload, adds the missing ipfs file', async () => {
        const callback = sinon.fake.resolves({ cid: '5xx' });
        sinon.replace(clients.ipfs.client, 'add', callback);

        const triggerItems = await ipfsMediaUploader('Audio').trigger(clients, undefined);
        await ipfsMediaUploader('Audio').processorFunction(triggerItems, clients);

        const track: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyAudioURL', 'like', '%5xx%']]]);
        assert(track[0].lossyAudioIPFSHash === '5xx', `ipfs hash not updated on processed tracks table: ${JSON.stringify(track[0])}`);

        const file: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%5xx%']]]);
        assert(file[0].cid === '5xx', `incorrect row returned, file was ${JSON.stringify(file[0])}`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls, [['where', ['url', 'like', '%5xx%']]]);
        assert(fileUrls.map((e: any) => e.cid).includes('5xx'), `did not sync the missing 5xx cid on ipfsFilesUrls table`);
      });

      it('with a failed upload, adds errors to ipfsFilesUrls', async () => {
        const callback = sinon.fake.rejects(new Error('oh noes!'));
        sinon.replace(clients.ipfs.client, 'add', callback);

        const triggerItems = await ipfsMediaUploader('Audio').trigger(clients, undefined);
        await ipfsMediaUploader('Audio').processorFunction(triggerItems, clients);

        const track: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyAudioURL', 'like', '%5xx%']]]);
        assert(!track[0].lossyAudioIPFSHash, `ipfs hash must not be updated when failing! ${JSON.stringify(track)}`);

        const file: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%5xx%']]]);
        assert(file.length === 0, `incorrect row returned, file was ${JSON.stringify(file)}`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls, [['where', ['url', 'like', '%5xx%']]]);
        assert(fileUrls[0].error === 'oh noes!', `did not add error message to ipfsFilesUrls table`);
      });
    });
  });

  // describe('lossyAudio', async () => {
  //   const ipfsFiles: IPFSFile[] = [
  //     { cid: '2xx' },
  //     { cid: '3xx', error: 'nope' },
  //   ]

  //   const ipfsFilesUrls: IPFSFileUrl[] = [
  //     { url: 'https://spinamp.xyz/2xx', cid: '2xx' },
  //     { url: 'https://spinamp.xyz/3xx', cid: '3xx' },
  //   ]

  //   const processedTracks: Partial<ProcessedTrack>[] = [
  //     { id: '11', lossyAudioIPFSHash: '1xx', lossyAudioURL: 'https://spinamp.xyz/1xx' },
  //     { id: '22', lossyAudioIPFSHash: '2xx', lossyAudioURL: 'https://spinamp.xyz/2xx' }, // skipped (already in ipfsFiles)
  //     { id: '33', lossyAudioIPFSHash: '3xx', lossyAudioURL: 'https://spinamp.xyz/3xx' }, // skipped (has an error)
  //     { id: '44', lossyAudioIPFSHash: '4xx', lossyAudioURL: 'https://spinamp.xyz/4xx' },
  //   ]

  //   const setupFixtures = async () => {
  //     await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
  //     await dbClient.insert<Partial<IPFSFileUrl>>(Table.ipfsFilesUrls, ipfsFilesUrls);
  //     await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
  //   };

  //   describe('trigger', async () => {
  //     beforeEach( async () => {
  //       await truncateDB(dbClient);
  //       await setupFixtures();
  //     });

  //     it ('returns ipfsFiles', async () => {
  //       const result: any = await ipfsFileSyncExistingPinsProcessor('lossyAudio').trigger(clients, undefined);

  //       assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
  //       assert(result[0].lossyAudioURL === 'https://spinamp.xyz/1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
  //       assert(result[0].lossyAudioIPFSHash === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
  //       assert(result[1].lossyAudioURL === 'https://spinamp.xyz/4xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
  //       assert(result[1].lossyAudioIPFSHash === '4xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
  //     });
  //   })

  //   describe('processor', async () => {
  //     beforeEach( async () => {
  //       await truncateDB(dbClient);
  //       await setupFixtures();
  //     })

  //     it('adds the missing ipfs file', async () => {
  //       const triggerItems = await ipfsFileSyncExistingPinsProcessor('lossyAudio').trigger(clients, undefined);
  //       await ipfsFileSyncExistingPinsProcessor('lossyAudio').processorFunction(triggerItems, clients);

  //       const file1: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%1xx%']]]);
  //       assert(file1[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(file1[0])}`);
  //       const file4: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%4xx%']]]);
  //       assert(file4[0].cid === '4xx', `incorrect row returned, file was ${JSON.stringify(file4[0])}`);

  //       const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls);
  //       assert(fileUrls.map((e: any) => e.cid).includes('1xx'), `did not sync the missing 1xx cid on ipfsFilesUrls table`);
  //       assert(fileUrls.map((e: any) => e.cid).includes('4xx'), `did not sync the missing 4xx cid on ipfsFilesUrls table`);
  //     });
  //   });
  // });
});
