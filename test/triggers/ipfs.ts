import assert from 'assert';

import { DBClient, Table } from '../../src/db/db';
import { initClients } from '../../src/runner';
import { artworkChanged } from '../../src/triggers/ipfs';
import { IPFSFile } from '../../src/types/ipfsFIle';
import { Clients } from '../../src/types/processor';
import { ProcessedTrack } from '../../src/types/track';

import db from './../../src/db/sql-db';

describe('triggers', async () => {
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
        { id: '1', lossyArtworkIPFSHash: '1xx', lossyArtworkURL: 'unchanged' },
        { id: '2', lossyArtworkIPFSHash: '2xx', lossyArtworkURL: 'no_corresponding_ipfs_file' }, // <-- this should be the only valid return!
        { id: '3', lossyArtworkIPFSHash: '2xx', lossyArtworkURL: 'has_ipfs_file' }, // multiple cid's for different urls are possible
        { id: '4', lossyArtworkIPFSHash: '4xx', lossyArtworkURL: 'ipfs://4xx' },
        { id: '5', lossyArtworkIPFSHash: undefined, lossyArtworkURL: 'errored' },
        { id: '6', lossyArtworkIPFSHash: undefined, lossyArtworkURL: undefined },
      ]

      const files = [
        { cid: '1xx', url: 'unchanged' },
        { cid: '2xx', url: 'old_one' },
        { cid: '2xx', url: 'has_ipfs_file' },
        { cid: undefined, url: 'errored', error: 'whoops' },
        { cid: '4xx', url: 'ipfs://4xx' },
        { cid: '5xx', url: 'orphaned' },
      ]

      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, tracks);
      await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, files);
    });

    it('returns tracks with lossyArtworkURL but no lossyArtworkIPFSHash', async () => {
      const tracks: any = await artworkChanged(clients, undefined)
      assert(tracks.length === 1, `should only return 1 track based on test data, instead returned ids: ${tracks.map((t: any) => t.id)}`);
      assert(tracks[0].id === '2', `incorrect row returned, result was ${tracks[0]}`);
    })
  })
})
