import assert from 'assert';

import { DBClient, Table } from '../../src/db/db';
import { ProcessedTrack } from '../../src/types/track';
import { truncateDB } from '../helpers'

import db from './../../src/db/sql-db';

describe('views', async () => {
  let dbClient: DBClient;

  // const ipfsFiles: IPFSFile[] = [
  //   { url: 'https://spinamp.xyz/1xx', cid: '1xx' },
  //   { url: 'https://spinamp.xyz/2xx', cid: undefined }, // skips undefined
  //   { url: 'https://spinamp.xyz/3xx', cid: '3xx', mimeType: 'image/jpeg' }, // skips existing
  //   { url: 'https://spinamp.xyz/4xx', cid: '4xx', error: 'nope' }, // skips errors
  //   { url: 'https://spinamp.xyz/5xx', cid: '5xx', mimeType: 'image/jpg', error: 'nope' }, // skips with mimeType and errors
  // ]

  const ipfsPins = [
    { id: '1xx', requestId: '1' },
    { id: '2xx', requestId: '2' },
    { id: '3xx', requestId: '3' },
    { id: '4xx', requestId: '4' },
    { id: '5xx', requestId: '5' },
  ]

  const processedTracks = [
    { id: '11', lossyArtworkIPFSHash: '1xx', lossyAudioIPFSHash: '3xx' },
    { id: '22', lossyArtworkIPFSHash: '4xx', lossyAudioIPFSHash: undefined }, // skips undefined
    { id: '33', lossyArtworkIPFSHash: undefined, lossyAudioIPFSHash: '5xx' }, // skips undefined
  ]

  const setupFixtures = async () => {
    // await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
    await dbClient.insert(Table.ipfsPins, ipfsPins);
    await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
  };

  before( async () => {
    dbClient = await db.init();
    await truncateDB(dbClient);
  });

  describe('processedTracks view', async () => {
    beforeEach( async () => {
      await truncateDB(dbClient);
      await setupFixtures();
    })

    it('only returns fully populated tracks', async () => {
      const tracks: any = await dbClient.rawSQL('SELECT * FROM processed_tracks');
      const result = tracks.rows;

      assert(result.length === 1, `should only return 1 track based on test data, instead returned ids: ${ result ? result.map((t: any) => t.id) : 'none' }`);
      assert(result[0].id === '11', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
    });
  });
})
