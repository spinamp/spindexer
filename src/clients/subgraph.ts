import { request, gql } from 'graphql-request'

import { Record, RecordType, recordIsInBatch } from '../types/record';
import { NFT } from '../types/nft';

export type SubgraphClient = {
  getRecordsFrom: (type: RecordType, timestamp: string) => Promise<Record[]>;
  getLatestRecord: (type: RecordType) => Promise<Record>;
  getNFTsFrom: (timestamp: string) => Promise<NFT[]>;
  getLatestNFT: () => Promise<NFT>;
}

const QUERIES = {
  getRecordsFrom: (recordType: RecordType, timestamp: string) => gql`
  {
    ${recordType}s(where:{createdAtTimestamp_gte:${timestamp}}, orderBy:createdAtTimestamp, orderDirection: asc, first:${process.env.SUBGRAPH_QUERY_LIMIT}) {
      id
      ${recordType === RecordType.nft ? 'contractAddress' : ''}
      ${recordType === RecordType.nft ? 'tokenId' : ''}
      ${recordType === RecordType.nft ? 'platform' : ''}
      ${recordType === RecordType.nft ? 'track{id}' : ''}
      createdAtTimestamp
      createdAtBlockNumber
    }
  }`,
  getRecordsAtBlock: (recordType: RecordType, block: string) => gql`
  {
    ${recordType}s(where:{createdAtBlockNumber:${block}}, orderBy: createdAtTimestamp, first:${process.env.SUBGRAPH_QUERY_LIMIT}) {
      id
      ${recordType === RecordType.nft ? 'contractAddress' : ''}
      ${recordType === RecordType.nft ? 'tokenId' : ''}
      ${recordType === RecordType.nft ? 'platform' : ''}
      ${recordType === RecordType.nft ? 'track{id}' : ''}
      createdAtTimestamp
      createdAtBlockNumber
    }
  }`,
  getLatestRecord: (recordType: RecordType) => gql`
  {
    ${recordType}s(orderBy: createdAtTimestamp, orderDirection: desc, first: 1) {
      id
      ${recordType === RecordType.nft ? 'contractAddress' : ''}
      ${recordType === RecordType.nft ? 'tokenId' : ''}
      ${recordType === RecordType.nft ? 'platform' : ''}
      ${recordType === RecordType.nft ? 'track{id}' : ''}
      createdAtTimestamp
      createdAtBlockNumber
    }
  }`,
};

const init = (endpoint: string) => {
  const getRecordsFrom = async (type: RecordType, timestamp: string) => {
    const fromResponseData = await request(endpoint, QUERIES.getRecordsFrom(type, timestamp));
    const nextRecordBatch = fromResponseData[`${type}s`];

    if (nextRecordBatch.length < process.env.SUBGRAPH_QUERY_LIMIT!) {
      return nextRecordBatch;
    }

    // We also need to get all records in the last block of a batch to ensure we do not miss
    // when multiple records are created in a single block and the cursor on the first query
    // does not include them all.
    const lastBlockInBatch = nextRecordBatch[nextRecordBatch.length - 1].createdAtBlockNumber;
    const blockResponseData = await request(endpoint, QUERIES.getRecordsAtBlock(type, lastBlockInBatch));
    const lastBlockRecords = blockResponseData[`${type}s`];
    const extraRecords = lastBlockRecords.filter((record: Record) => !recordIsInBatch(record, nextRecordBatch));
    const allRecords = nextRecordBatch.concat(...extraRecords);

    return allRecords;
  };
  const getLatestRecord = async (type: RecordType): Promise<Record> => {
    const data = await request(endpoint, QUERIES.getLatestRecord(type));
    return data[`${type}s`][0];
  };
  const getNFTsFrom = async (timestamp: string): Promise<NFT[]> => {
    return getRecordsFrom(RecordType.nft, timestamp);
  };
  const getLatestNFT = async () => {
    return getLatestRecord(RecordType.nft) as Promise<NFT>;
  };
  return {
    getRecordsFrom,
    getLatestRecord,
    getNFTsFrom,
    getLatestNFT
  }
}

export default {
  init
}
