import { request, gql } from 'graphql-request'

import { Record, RecordType, recordIsInBatch } from './helpers';
import { NFT } from './nfts';

const QUERIES = {
  getRecordsFrom: (recordType: RecordType, startBlock: Number) => gql`
  {
    ${recordType}s(where:{createdAtBlockNumber_gte:${startBlock}}, orderBy:createdAtBlockNumber, orderDirection: asc, first:${process.env.SUBGRAPH_QUERY_LIMIT}) {
      id
      ${recordType === RecordType.nft ? 'contractAddress' : ''}
      ${recordType === RecordType.nft ? 'tokenId' : ''}
      ${recordType === RecordType.nft ? 'platform' : ''}
      ${recordType === RecordType.nft ? 'track{id}' : ''}
      createdAtBlockNumber
    }
  }`,
  getRecordsAtBlock: (recordType: RecordType, block: Number) => gql`
  {
    ${recordType}s(where:{createdAtBlockNumber:${block}}, first:${process.env.SUBGRAPH_QUERY_LIMIT}) {
      id
      ${recordType === RecordType.nft ? 'contractAddress' : ''}
      ${recordType === RecordType.nft ? 'tokenId' : ''}
      ${recordType === RecordType.nft ? 'platform' : ''}
      ${recordType === RecordType.nft ? 'track{id}' : ''}
      createdAtBlockNumber
    }
  }`,
  getLatestRecord: (recordType: RecordType) => gql`
  {
    ${recordType}s(orderBy: createdAtBlockNumber, orderDirection: desc, first: 1) {
      id
      ${recordType === RecordType.nft ? 'contractAddress' : ''}
      ${recordType === RecordType.nft ? 'tokenId' : ''}
      ${recordType === RecordType.nft ? 'platform' : ''}
      ${recordType === RecordType.nft ? 'track{id}' : ''}
      createdAtBlockNumber
    }
  }`,
};

const init = (endpoint: string) => {
  const getRecordsFrom = async (type: RecordType, startBlock: Number) => {
    const fromResponseData = await request(endpoint, QUERIES.getRecordsFrom(type, startBlock));
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
  const getLatestRecord = async (type: RecordType) => {
    const data = await request(endpoint, QUERIES.getLatestRecord(type));
    return data[`${type}s`][0];
  };
  const getNFTsFrom = async (startBlock: Number): Promise<NFT[]> => {
    return getRecordsFrom(RecordType.nft, startBlock);
  };
  const getLatestNFT = async () => {
    return getLatestRecord(RecordType.nft);
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
