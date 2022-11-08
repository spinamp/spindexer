import assert from 'assert';

import { DBClient, Table } from '../../src/db/db';
import { initClients } from '../../src/runner';
import { artworkChanged } from '../../src/triggers/ipfs';
import { IPFSFile } from '../../src/types/ipfsFIle';
import { Clients } from '../../src/types/processor';
import { ProcessedTrack } from '../../src/types/track';

import db from './../../src/db/sql-db';

describe('triggers', () => {
  let dbClient: DBClient;
  let clients: Clients;
  const previousBatchSize = process.env.IPFS_UPLOAD_BATCH_SIZE;

  const truncateDB = async () => {
    await dbClient.rawSQL(`TRUNCATE TABLE ${Object.values(Table).join(', ')} CASCADE;`);
  }

  before( async () => {
    process.env.IPFS_UPLOAD_BATCH_SIZE = '5';
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB();
  });

  after( async () => {
    process.env.IPFS_UPLOAD_BATCH_SIZE = previousBatchSize;
  });

  describe('artworkChanged', async () => {
    before( async () => {
      const tracks = [
        { id: '1', lossyArtworkIPFSHash: '1', lossyArtworkURL: 'unchanged' },
        { id: '2', lossyArtworkIPFSHash: '2', lossyArtworkURL: 'will_have_changed' }, // expecting to return only this
        { id: '3', lossyArtworkIPFSHash: undefined, lossyArtworkURL: 'errored' },
        { id: '4', lossyArtworkIPFSHash: undefined, lossyArtworkURL: undefined },
      ]

      const files = [
        { cid: '1', url: 'unchanged' },
        { cid: '2', url: 'definitely_changed_now' },
        { cid: undefined, url: 'errored', error: 'whoops' },
        { cid: '5', url: 'orphaned' },
      ]

      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, tracks);
      await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, files);
    });

    it('returns tracks with lossyArtworkURL but no lossyArtworkIPFSHash', async () => {
      const tracks: any = await artworkChanged(clients, undefined)
      assert(tracks.length === 1, `should only return 1 track based on test data, instead returned ${tracks}`);
      assert(tracks[0].lossyArtworkURL === 'will_have_changed', `incorrect row returned, result was ${tracks[0]}`);
    })
  })
})
