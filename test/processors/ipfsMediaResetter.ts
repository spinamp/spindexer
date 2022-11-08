import assert from 'assert'

import { DBClient, Table } from '../../src/db/db';
import { ipfsArtworkResetter } from '../../src/processors/default/ipfsMediaResetter';
import { initClients } from '../../src/runner';
import { artworkChanged } from '../../src/triggers/ipfs';
import { IPFSFile } from '../../src/types/ipfsFIle';
import { Clients } from '../../src/types/processor';
import { ProcessedTrack } from '../../src/types/track';

import db from './../../src/db/sql-db';

describe('ipfsMediaResetter', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  const truncateDB = async () => {
    await dbClient.rawSQL(`TRUNCATE TABLE ${Object.values(Table).join(', ')} CASCADE;`);
  }

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB();
  });

  describe('processorFunction', async () => {
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

    it('resets the changed processedTrack and deletes the ipfsFile', async () => {
      const trackFileJoins: any = await artworkChanged(clients, undefined)
      await ipfsArtworkResetter.processorFunction(trackFileJoins, clients);
      const tracks: any[] = await dbClient.getRecords<ProcessedTrack>(Table.processedTracks);
      const ipfs: any[] = await dbClient.getRecords<IPFSFile>(Table.ipfsFiles);
      assert(!!!tracks.find((e) => e['id'] === '2').lossyArtworkIPFSHash, `track IPFS was not cleared, result was ${JSON.stringify(tracks)}`);
      assert(!!!ipfs.find((e) => e['cid'] === '2'), `ipfs file was not deleted, result was ${JSON.stringify(ipfs)}`);
    })
  })
})
