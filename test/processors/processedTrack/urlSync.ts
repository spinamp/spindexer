import assert from 'assert';

import { DBClient, Table } from '../../../src/db/db';
import db from '../../../src/db/sql-db';
import { processedTrackUrlSync } from '../../../src/processors/processedTrack/urlSyncProcessor';
import { initClients } from '../../../src/runner';
import { Clients } from '../../../src/types/processor';
import { ProcessedTrack } from '../../../src/types/track';
import { truncateDB } from '../../helpers'

describe('processedTrackUrlSync', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  describe('lossyArtwork', async () => {
    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11', lossyArtworkIPFSHash: '1xx', title: '111' },
      { id: '22', lossyArtworkIPFSHash: '2xx', lossyArtworkURL: 'https://spinamp.xyz/2xx' }, // skipped (already processed)
      { id: '33' } // skipped (has no cid)
    ]

    const setupFixtures = async () => {
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
    };

    describe('trigger', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      });

      it ('returns ipfsFiles without a url', async () => {
        const result: any = await processedTrackUrlSync('lossyArtwork').trigger(clients, undefined);

        assert(result.length === 1, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
        assert(result[0].lossyArtworkIPFSHash === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      });
    })

    describe('processor', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      })

      it('populates the URL', async () => {
        const triggerItems = await processedTrackUrlSync('lossyArtwork').trigger(clients, undefined);
        await processedTrackUrlSync('lossyArtwork').processorFunction(triggerItems, clients);

        const track1: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyArtworkIPFSHash', 'like', '%1xx%']]]);
        assert(track1[0].lossyArtworkURL?.includes('1xx'), `did not set url properly on processed track: ${JSON.stringify(track1[0])}`);
        assert(track1[0].title === '111', `did not leave existing track details intact when updating: ${JSON.stringify(track1[0])}`);
      });
    });
  });

  describe('lossyAudio', async () => {
    const processedTracks: Partial<ProcessedTrack>[] = [
      { id: '11', lossyAudioIPFSHash: '1xx', title: '111' },
      { id: '22', lossyAudioIPFSHash: '2xx', lossyAudioURL: 'https://spinamp.xyz/2xx' }, // skipped (already processed)
      { id: '33' } // skipped (has no cid)
    ]

    const setupFixtures = async () => {
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
    };

    describe('trigger', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      });

      it ('returns ipfsFiles without a url', async () => {
        const result: any = await processedTrackUrlSync('lossyAudio').trigger(clients, undefined);

        assert(result.length === 1, `should only return 1 file based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.cid) : 'none' }`);
        assert(result[0].lossyAudioIPFSHash === '1xx', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
      });
    })

    describe('processor', async () => {
      beforeEach( async () => {
        await truncateDB(dbClient);
        await setupFixtures();
      })

      it('populates the URL', async () => {
        const triggerItems = await processedTrackUrlSync('lossyAudio').trigger(clients, undefined);
        await processedTrackUrlSync('lossyAudio').processorFunction(triggerItems, clients);

        const track1: any = await dbClient.getRecords(Table.processedTracks, [['where', ['lossyAudioIPFSHash', 'like', '%1xx%']]]);
        assert(track1[0].lossyAudioURL?.includes('1xx'), `did not set url properly on processed track: ${JSON.stringify(track1[0])}`);
        assert(track1[0].title === '111', `did not leave existing track details intact when updating: ${JSON.stringify(track1[0])}`);
      });
    });
  });
});
