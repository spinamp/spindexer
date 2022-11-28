import assert from 'assert';

import { DBClient, Table } from '../../src/db/db';
import { IPFSFile } from '../../src/types/ipfsFile';
import { ProcessedTrack } from '../../src/types/track';
import { truncateDB } from '../helpers'

import db from './../../src/db/sql-db';

describe('views', async () => {
  let dbClient: DBClient;

  const ipfsFiles: IPFSFile[] = [
    { url: 'https://spinamp.xyz/1xx', cid: '1xx', mimeType: 'image/jpeg' },
    { url: 'https://spinamp.xyz/2xx', cid: undefined, mimeType: 'image/jpeg' }, // undefined cid skipped later
    { url: 'https://spinamp.xyz/3xx', cid: '3xx', mimeType: 'image/jpeg' },
    { url: 'https://spinamp.xyz/4xx', cid: '4xx', mimeType: 'image/jpeg' },
    { url: 'https://spinamp.xyz/5xx', cid: '5xx', mimeType: 'image/jpeg' },
    { url: 'https://spinamp.xyz/6xx', cid: '6xx', mimeType: 'image/jpeg' },
    { url: 'https://spinamp.xyz/7xx', cid: '7xx', mimeType: 'image/jpeg' },
    { url: 'https://spinamp.xyz/noArtworkMimeType', cid: 'noArtworkMimeType' }, // no mime type skipped later
    { url: 'https://spinamp.xyz/noAudioMimeType', cid: 'noAudioMimeType' }, // no mime type skipped later
  ]

  const ipfsPins = [
    { id: '1xx', requestId: '1' },
    { id: '2xx', requestId: '2' },
    { id: '3xx', requestId: '3' },
    { id: '4xx', requestId: '4' },
    { id: '5xx', requestId: '5' },
    { id: '6xx', requestId: '6' },
    { id: '7xx', requestId: '7' },
    { id: 'noArtworkMimeType', requestId: '8' },
    { id: 'noAudioMimeType', requestId: '9' },
  ]

  const processedTracks = [
    { id: '11', lossyArtworkIPFSHash: '1xx', lossyAudioIPFSHash: '3xx' },
    { id: '22', lossyArtworkIPFSHash: '4xx', lossyAudioIPFSHash: undefined }, // skips undefined
    { id: '33', lossyArtworkIPFSHash: undefined, lossyAudioIPFSHash: '5xx' }, // skips undefined
    { id: '44', lossyArtworkIPFSHash: 'noArtworkMimeType', lossyAudioIPFSHash: '6xx' }, // skips when missing artwork mimetype
    { id: '55', lossyArtworkIPFSHash: '7xx', lossyAudioIPFSHash: 'noAudioMimeType' }, // skips when missing audio mimetype
    { id: '66', lossyArtworkIPFSHash: '1xx', lossyAudioIPFSHash: '2xx' }, // skips undefined cid on ipfsFiles
  ]

  const setupFixtures = async () => {
    await dbClient.insert<Partial<IPFSFile>>(Table.ipfsFiles, ipfsFiles);
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

      assert(result.length === 1, `should only return 1 track based on test data, instead returned ids: ${ result.length > 0 ? result.map((t: any) => t.id) : 'none' }`);
      assert(result[0].id === '11', `incorrect row returned, result was ${JSON.stringify(result[0])}`);
    });
  });
})
