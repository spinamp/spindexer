import assert from 'assert';

import { DBClient, Table } from '../../../src/db/db';
import db from '../../../src/db/sql-db';
import { ipfsFileSyncExistingUploadsProcessor, ipfsFileSyncExternalUploadsProcessor } from '../../../src/processors/ipfsFile/syncExistingPinsProcessor';
import { initClients } from '../../../src/runner';
import { IPFSFile, IPFSFileUrl } from '../../../src/types/ipfsFile';
import { Clients } from '../../../src/types/processor';
import { ProcessedTrack } from '../../../src/types/track';
import { truncateDB } from '../../helpers'

describe('ipfsFileSyncExistingUploadsProcessor', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  describe('lossyArtwork', async () => {
    const ipfsFiles: IPFSFile[] = [
      { cid: '2xx' },
      { cid: '3xx', error: 'nope' },
    ]
    const ipfsFilesUrls: IPFSFileUrl[] = [
      { url: 'https://spinamp.xyz/2xx', cid: '2xx' },
      { url: 'https://spinamp.xyz/3xx', cid: '3xx' },
    ]

    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11', lossyArtworkIPFSHash: '1xx', lossyArtworkURL: 'https://spinamp.xyz/1xx' },
      { id: '22', lossyArtworkIPFSHash: '2xx', lossyArtworkURL: 'https://spinamp.xyz/2xx' }, // skipped (already in ipfsFiles)
      { id: '33', lossyArtworkIPFSHash: '3xx', lossyArtworkURL: 'https://spinamp.xyz/3xx' }, // skipped (has an error)
      { id: '44', lossyArtworkIPFSHash: 'cid-not-part-of-url', lossyArtworkURL: 'https://spinamp.xyz/4xx' },
    ]

    const setupFixtures = async () => {
      await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
      await dbClient.insert<Partial<IPFSFileUrl>>(Table.ipfsFilesUrls, ipfsFilesUrls);
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
    };

    describe('trigger', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      });

      it ('returns ipfsFiles', async () => {
        const result: any = await ipfsFileSyncExistingUploadsProcessor('lossyArtwork').trigger(clients, undefined);

        assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
        assert(result[0].lossyArtworkURL === 'https://spinamp.xyz/1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[0].lossyArtworkIPFSHash === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[1].lossyArtworkURL === 'https://spinamp.xyz/4xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[1].lossyArtworkIPFSHash === 'cid-not-part-of-url', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      });
    })

    describe('processor', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      })

      it('adds the missing ipfs file', async () => {
        const triggerItems = await ipfsFileSyncExistingUploadsProcessor('lossyArtwork').trigger(clients, undefined);
        await ipfsFileSyncExistingUploadsProcessor('lossyArtwork').processorFunction(triggerItems, clients);

        const file1: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%1xx%']]]);
        assert(file1[0]?.cid === '1xx', `incorrect row returned, file was ${JSON.stringify(file1[0])}`);

        const file4: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%cid-not-part-of-url%']]]);
        assert(file4[0]?.cid === 'cid-not-part-of-url', `incorrect row returned, file was ${JSON.stringify(file4[0])}`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls);
        assert(fileUrls.map((e: any) => e.cid).includes('1xx'), `did not sync the missing 1xx cid on ipfsFilesUrls table`);
        assert(fileUrls.map((e: any) => e.cid).includes('cid-not-part-of-url'), `did not sync the missing cid-not-part-of-url cid on ipfsFilesUrls table`);
      });
    });
  });

  describe('lossyAudio', async () => {
    const ipfsFiles: IPFSFile[] = [
      { cid: '2xx' },
      { cid: '3xx', error: 'nope' },
    ]

    const ipfsFilesUrls: IPFSFileUrl[] = [
      { url: 'https://spinamp.xyz/2xx', cid: '2xx' },
      { url: 'https://spinamp.xyz/3xx', cid: '3xx' },
    ]

    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11', lossyAudioIPFSHash: '1xx', lossyAudioURL: 'https://spinamp.xyz/1xx' },
      { id: '22', lossyAudioIPFSHash: '2xx', lossyAudioURL: 'https://spinamp.xyz/2xx' }, // skipped (already in ipfsFiles)
      { id: '33', lossyAudioIPFSHash: '3xx', lossyAudioURL: 'https://spinamp.xyz/3xx' }, // skipped (has an error)
      { id: '44', lossyAudioIPFSHash: 'cid-not-part-of-url', lossyAudioURL: 'https://spinamp.xyz/4xx' },
    ]

    const setupFixtures = async () => {
      await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
      await dbClient.insert<Partial<IPFSFileUrl>>(Table.ipfsFilesUrls, ipfsFilesUrls);
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
    };

    describe('trigger', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      });

      it ('returns ipfsFiles', async () => {
        const result: any = await ipfsFileSyncExistingUploadsProcessor('lossyAudio').trigger(clients, undefined);

        assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
        assert(result[0].lossyAudioURL === 'https://spinamp.xyz/1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[0].lossyAudioIPFSHash === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[1].lossyAudioURL === 'https://spinamp.xyz/4xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[1].lossyAudioIPFSHash === 'cid-not-part-of-url', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      });
    })

    describe('processor', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      })

      it('adds the missing ipfs file', async () => {
        const triggerItems = await ipfsFileSyncExistingUploadsProcessor('lossyAudio').trigger(clients, undefined);
        await ipfsFileSyncExistingUploadsProcessor('lossyAudio').processorFunction(triggerItems, clients);

        const file1: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%1xx%']]]);
        assert(file1[0]?.cid === '1xx', `incorrect row returned, file was ${JSON.stringify(file1[0])}`);
        const file4: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%cid-not-part-of-url%']]]);
        assert(file4[0]?.cid === 'cid-not-part-of-url', `incorrect row returned, file was ${JSON.stringify(file4[0])}`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls);
        assert(fileUrls.map((e: any) => e.cid).includes('1xx'), `did not sync the missing 1xx cid on ipfsFilesUrls table`);
        assert(fileUrls.map((e: any) => e.cid).includes('cid-not-part-of-url'), `did not sync the missing cid on ipfsFilesUrls table`);
      });
    });
  });
});

describe('ipfsFileSyncExternalUploadsProcessor', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  describe('lossyArtwork', async () => {
    const ipfsFiles: IPFSFile[] = [
      { cid: '2xx' },
    ]
    const ipfsFilesUrls: IPFSFileUrl[] = [
      { url: 'https://spinamp.xyz/2xx', cid: '2xx' },
      { url: 'https://spinamp.xyz/3xx', error: 'nope' },
    ]

    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11', lossyArtworkIPFSHash: '1xx', title: '111' },
      { id: '22', lossyArtworkIPFSHash: '2xx', lossyArtworkURL: 'https://spinamp.xyz/2xx' }, // skipped (already processed)
      { id: '33', lossyArtworkIPFSHash: '3xx', lossyArtworkURL: 'https://spinamp.xyz/3xx' }, // skipped (has an error)
      { id: '44', lossyArtworkIPFSHash: '4xx' },
    ]

    const setupFixtures = async () => {
      await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
      await dbClient.insert<Partial<IPFSFileUrl>>(Table.ipfsFilesUrls, ipfsFilesUrls);
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
    };

    describe('trigger', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      });

      it ('returns ipfsFiles', async () => {
        const result: any = await ipfsFileSyncExternalUploadsProcessor('lossyArtwork').trigger(clients, undefined);

        assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
        assert(result[0].lossyArtworkIPFSHash === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[1].lossyArtworkIPFSHash === '4xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      });
    })

    describe('processor', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      })

      it('adds the missing ipfs file url', async () => {
        const triggerItems = await ipfsFileSyncExternalUploadsProcessor('lossyArtwork').trigger(clients, undefined);
        await ipfsFileSyncExternalUploadsProcessor('lossyArtwork').processorFunction(triggerItems, clients);

        const track1: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyArtworkIPFSHash', 'like', '%1xx%']]]);
        assert(track1[0].lossyArtworkURL?.includes('1xx'), `did not set url properly on processed track: ${JSON.stringify(track1[0])}`);
        assert(track1[0].title === '111', `did not leave existing track details intact when updating: ${JSON.stringify(track1[0])}`);
        const track4: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyArtworkIPFSHash', 'like', '%4xx%']]]);
        assert(track4[0].lossyArtworkURL?.includes('4xx'), `did not set url properly on processed track: ${JSON.stringify(track4[0])}`);

        const file1: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%1xx%']]]);
        assert(file1[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(file1[0])}`);

        const file4: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%4xx%']]]);
        assert(file4[0].cid === '4xx', `incorrect row returned, file was ${JSON.stringify(file4[0])}`);

        const files: any = await dbClient.getRecords(Table.ipfsFiles);
        assert(files.map((e: any) => e.cid).includes('1xx'), `did not sync the missing 1xx cid on ipfsFiles table`);
        assert(files.map((e: any) => e.cid).includes('4xx'), `did not sync the missing 4xx cid on ipfsFiles table`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls);
        assert(fileUrls.some((e: any) => e.url.includes('1xx')), `did not sync the missing 1xx url on ipfsFilesUrls table`);
        assert(fileUrls.some((e: any) => e.url.includes('4xx')), `did not sync the missing 4xx url on ipfsFilesUrls table`);
      });
    });
  });

  describe('lossyAudio', async () => {
    const ipfsFiles: IPFSFile[] = [
      { cid: '2xx' },
    ]
    const ipfsFilesUrls: IPFSFileUrl[] = [
      { url: 'https://spinamp.xyz/2xx', cid: '2xx' },
      { url: 'https://spinamp.xyz/3xx', error: 'nope' },
    ]

    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11', lossyAudioIPFSHash: '1xx', title: '111' },
      { id: '22', lossyAudioIPFSHash: '2xx', lossyAudioURL: 'https://spinamp.xyz/2xx' }, // skipped (already processed)
      { id: '33', lossyAudioIPFSHash: '3xx', lossyAudioURL: 'https://spinamp.xyz/3xx' }, // skipped (has an error)
      { id: '44', lossyAudioIPFSHash: '4xx' },
    ]

    const setupFixtures = async () => {
      await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
      await dbClient.insert<Partial<IPFSFileUrl>>(Table.ipfsFilesUrls, ipfsFilesUrls);
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
    };

    describe('trigger', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      });

      it ('returns ipfsFiles', async () => {
        const result: any = await ipfsFileSyncExternalUploadsProcessor('lossyAudio').trigger(clients, undefined);

        assert(result.length === 2, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
        assert(result[0].lossyAudioIPFSHash === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
        assert(result[1].lossyAudioIPFSHash === '4xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      });
    })

    describe('processor', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      })

      it('adds the missing ipfs file url', async () => {
        const triggerItems = await ipfsFileSyncExternalUploadsProcessor('lossyAudio').trigger(clients, undefined);
        await ipfsFileSyncExternalUploadsProcessor('lossyAudio').processorFunction(triggerItems, clients);

        const track1: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyAudioIPFSHash', 'like', '%1xx%']]]);
        assert(track1[0].lossyAudioURL?.includes('1xx'), `did not set url properly on processed track: ${JSON.stringify(track1[0])}`);
        assert(track1[0].title === '111', `did not leave existing track details intact when updating: ${JSON.stringify(track1[0])}`);
        const track4: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyAudioIPFSHash', 'like', '%4xx%']]]);
        assert(track4[0].lossyAudioURL?.includes('4xx'), `did not set url properly on processed track: ${JSON.stringify(track4[0])}`);

        const file1: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%1xx%']]]);
        assert(file1[0].cid === '1xx', `incorrect row returned, file was ${JSON.stringify(file1[0])}`);

        const file4: any = await dbClient.getRecords(Table.ipfsFiles, [['where', ['cid', 'like', '%4xx%']]]);
        assert(file4[0].cid === '4xx', `incorrect row returned, file was ${JSON.stringify(file4[0])}`);

        const files: any = await dbClient.getRecords(Table.ipfsFiles);
        assert(files.map((e: any) => e.cid).includes('1xx'), `did not sync the missing 1xx cid on ipfsFiles table`);
        assert(files.map((e: any) => e.cid).includes('4xx'), `did not sync the missing 4xx cid on ipfsFiles table`);

        const fileUrls: any = await dbClient.getRecords(Table.ipfsFilesUrls);
        assert(fileUrls.some((e: any) => e.url.includes('1xx')), `did not sync the missing 1xx url on ipfsFilesUrls table`);
        assert(fileUrls.some((e: any) => e.url.includes('4xx')), `did not sync the missing 4xx url on ipfsFilesUrls table`);
      });
    });
  });
});
