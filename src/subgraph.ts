import { request, gql } from 'graphql-request'

import { Record, RecordType, recordIsInBatch } from './helpers';

const QUERY_LIMIT = 300;

const QUERIES = {
  getRecordsFrom: (recordType: RecordType, startBlock: Number) => gql`
  {
    ${recordType}s(where:{createdAtBlockNumber_gte:${startBlock}}, orderBy:createdAtBlockNumber, orderDirection: asc, first:${QUERY_LIMIT}) {
        id
        createdAtBlockNumber
    }
  }`,
  getRecordsAtBlock: (recordType: RecordType, block: Number) => gql`
  {
    ${recordType}s(where:{createdAtBlockNumber:${block}}, first:${QUERY_LIMIT}) {
        id
        createdAtBlockNumber
    }
  }`,
  getLatestRecord: (recordType: RecordType) => gql`
  {
    ${recordType}s(orderBy: createdAtBlockNumber, orderDirection: desc, first: 1) {
      id
      createdAtBlockNumber
    }
  }`,
}
const init = (endpoint: string) => {
  return {
    getTracksFrom: async (startBlock: Number) => {
      const { tracks: nextTrackBatch } = await request(endpoint, QUERIES.getRecordsFrom(RecordType.track, startBlock));

      if (nextTrackBatch.length < QUERY_LIMIT) {
        return nextTrackBatch;
      }

      // We also need to get all tracks in the last block of a batch to ensure we do not miss
      // when multiple tracks are minted in a single block and the cursor on the first query
      // does not include them all.
      const lastBlockInBatch = nextTrackBatch[nextTrackBatch.length - 1].createdAtBlockNumber;
      const { tracks: lastBlockTracks } = await request(endpoint, QUERIES.getRecordsAtBlock(RecordType.track, lastBlockInBatch));
      const extraTracks = lastBlockTracks.filter((track: Record) => !recordIsInBatch(track, nextTrackBatch));
      const allTracks = nextTrackBatch.concat(...extraTracks);

      return allTracks;
    },
    getLatestTrack: async () => {
      const data = await request(endpoint, QUERIES.getLatestRecord(RecordType.track));
      return data.tracks[0];
    },
  }
}

export default {
  init
}
