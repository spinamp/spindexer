import assert from 'assert';

import { DBClient, Table } from '../../src/db/db';
import { Artist } from '../../src/types/artist';

import db from './../../src/db/sql-db';

describe('DBClient', async () => {
  let dbClient: DBClient;

  const truncateDB = async () => {
    await dbClient.rawSQL(`TRUNCATE TABLE ${Object.values(Table).join(', ')} CASCADE;`);
  }

  describe('insert with options to merge', async () => {
    before( async () => {
      dbClient = await db.init();
      await truncateDB();
    });

    it('only replaces previously undefined fields', async () => {
      await dbClient.insert(Table.artists, [{ id: '1', name: 'older', address: undefined }, { id: '2', name: 'no-modify', address: 'no-modify' }]);
      await dbClient.insert(Table.artists, [{ id: '1', name: 'newer', address: 'abc' }, { id: '2', name: 'unrelated', address: undefined }], { replaceUndefinedOnly: 'id' });

      const result = await dbClient.getRecords<Artist>(Table.artists);
      assert.equal(result[0].name, 'older');
      assert.equal(result[0].address, 'abc');
      assert.equal(result[1].name, 'no-modify');
      assert.equal(result[1].address, 'no-modify');
    })

    it('merges older records')
  })
})
