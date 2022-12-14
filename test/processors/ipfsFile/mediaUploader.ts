import assert from 'assert';

import sinon from 'sinon';

import { DBClient, Table } from '../../../src/db/db';
import db from '../../../src/db/sql-db';
import { ipfsMediaUploader } from '../../../src/processors/ipfsFile/mediaUploader';
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

      it('with a successful upload, adds the missing ipfsFilesUrl', async () => {
        const callback = sinon.fake.resolves({ cid: '5xx' });
        sinon.replace(clients.ipfs.client, 'add', callback);

        const triggerItems = await ipfsMediaUploader('Audio').trigger(clients, undefined);
        await ipfsMediaUploader('Audio').processorFunction(triggerItems, clients);

        const track: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyAudioURL', 'like', '%5xx%']]]);
        assert(track[0].lossyAudioIPFSHash === '5xx', `ipfs hash not updated on processed tracks table: ${JSON.stringify(track[0])}`);

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

  describe('ipfsArtworkUploader', async () => {
    const ipfsFilesUrls: IPFSFileUrl[] = [
      { url: 'https://spinamp.xyz/4xx', error: 'nope' },
    ]

    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11' }, // skipped (no cid, no url)
      { id: '22', lossyArtworkIPFSHash: '2xx' }, // skipped (already has cid) [mintsongs/chaos example]
      { id: '33', lossyArtworkIPFSHash: '3xx', lossyArtworkURL: 'https://spinamp.xyz/3xx' }, // skipped (already uploaded)
      { id: '44', lossyArtworkURL: 'https://spinamp.xyz/4xx' }, // skipped (error set on ipfsFilesUrls table)
      { id: '55', lossyArtworkURL: 'https://spinamp.xyz/5xx' },
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
        const result: any = await ipfsMediaUploader('Artwork').trigger(clients, undefined);

        assert(result.length === 1, `should only return 1 file based on test data, instead returned: ${ result.length > 0 ? JSON.stringify(result) : 'none' }`);
        assert(result[0].lossyArtworkURL === 'https://spinamp.xyz/5xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
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

        const triggerItems = await ipfsMediaUploader('Artwork').trigger(clients, undefined);
        await ipfsMediaUploader('Artwork').processorFunction(triggerItems, clients);

        const track: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyArtworkURL', 'like', '%5xx%']]]);
        assert(track[0].lossyArtworkIPFSHash === '5xx', `ipfs hash not updated on processed tracks table: ${JSON.stringify(track[0])}`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls, [['where', ['url', 'like', '%5xx%']]]);
        assert(fileUrls.map((e: any) => e.cid).includes('5xx'), `did not sync the missing 5xx cid on ipfsFilesUrls table`);
      });

      it('with a failed upload, adds errors to ipfsFilesUrls', async () => {
        const callback = sinon.fake.rejects(new Error('oh noes!'));
        sinon.replace(clients.ipfs.client, 'add', callback);

        const triggerItems = await ipfsMediaUploader('Artwork').trigger(clients, undefined);
        await ipfsMediaUploader('Artwork').processorFunction(triggerItems, clients);

        const track: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyArtworkURL', 'like', '%5xx%']]]);
        assert(!track[0].lossyAudioIPFSHash, `ipfs hash must not be updated when failing! ${JSON.stringify(track)}`);

        const file: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%5xx%']]]);
        assert(file.length === 0, `incorrect row returned, file was ${JSON.stringify(file)}`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls, [['where', ['url', 'like', '%5xx%']]]);
        assert(fileUrls[0].error === 'oh noes!', `did not add error message to ipfsFilesUrls table`);
      });
    });
  });
});
