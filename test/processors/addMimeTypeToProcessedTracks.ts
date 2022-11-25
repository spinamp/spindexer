import assert from 'assert';

import { DBClient, Table } from '../../src/db/db';
import { missingMimeType, SourceIPFS } from '../../src/processors/default/addMimeTypeToProcessedTracks';
import { initClients } from '../../src/runner';
import { NFT } from '../../src/types/nft';
import { NFTProcessError } from '../../src/types/nftProcessError';
import { Clients } from '../../src/types/processor';
import { ProcessedTrack } from '../../src/types/track';
import { truncateDB } from '../helpers'

import db from './../../src/db/sql-db';

describe('missingMimeType', async () => {
  let dbClient: DBClient;
  let clients: Clients;

  before( async () => {
    dbClient = await db.init();
    clients = await initClients(dbClient);
    await truncateDB(dbClient);
  });

  describe('for lossyArtworkMimeType', async () => {
    before( async () => {
      const nfts = [
        { id: '1', contractAddress: '1', approved: true },
        { id: '2', contractAddress: '2', approved: true },
        { id: '3', contractAddress: '3', approved: true },
        { id: '4', contractAddress: '4', approved: true },
        { id: '5', contractAddress: '5', approved: true },
        { id: '6', contractAddress: '6', approved: false },
        { id: '7', contractAddress: '7' },
      ]
      const processedTracks = [
        { id: '11', lossyArtworkIPFSHash: '1xx' },
        { id: '22', lossyArtworkIPFSHash: undefined }, // skips undefined
        { id: '33', lossyArtworkIPFSHash: '3xx', lossyArtworkMimeType: 'image/jpeg' }, // skips existing
        { id: '44', lossyArtworkIPFSHash: '4xx' }, // skips with metadata errors
        { id: '55', lossyArtworkIPFSHash: '5xx' }, // skips with process errors
        { id: '66', lossyArtworkIPFSHash: '6xx' }, // skips unapproved, unprocessed nfts
        { id: '77', lossyArtworkIPFSHash: '7xx' }, // skips unapproved, processed nfts
      ]
      const nftsProcessedTracks = [
        { nftId: '1', processedTrackId: '11' },
        { nftId: '2', processedTrackId: '22' },
        { nftId: '3', processedTrackId: '33' },
        { nftId: '4', processedTrackId: '44' },
        { nftId: '5', processedTrackId: '55' },
        { nftId: '7', processedTrackId: '77' },
      ]
      const errors = [
        { nftId: '4', metadataError: 'error' },
        { nftId: '5', processError: 'error' },
      ]

      await dbClient.insert<Partial<NFT>>(Table.nfts, nfts);
      await dbClient.insert<Partial<ProcessedTrack>>(Table.processedTracks, processedTracks);
      await dbClient.insert<Partial<NFTProcessError>>(Table.nftProcessErrors, errors);
      await dbClient.insert(Table.nfts_processedTracks, nftsProcessedTracks);
    });

    it('returns tracks with lossyArtworkURL but no lossyArtworkIPFSHash', async () => {
      const tracks: any = await missingMimeType(SourceIPFS.ARTWORK)(clients, undefined);
      console.log(tracks);
      assert(tracks.length === 1, `should only return 1 track based on test data, instead returned ids: ${ tracks ? tracks.map((t: any) => t.id) : 'none' }`);
      assert(tracks[0].id === '11', `incorrect row returned, result was ${tracks[0]}`);
      assert(tracks[0].nftId === '1', `incorrect row returned, result was ${tracks[0]}`);
    })
  })
})
