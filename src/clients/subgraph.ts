import { request, gql } from 'graphql-request'
import { MusicPlatform } from '../types/platform';

export type SubgraphClient = {
  getRecordsFrom: (timestamp: string) => Promise<SubgraphNFT[]>;
  getLatestRecord: () => Promise<SubgraphNFT>;
  getNFTsFrom: (timestamp: string) => Promise<SubgraphNFT[]>;
  getLatestNFT: () => Promise<SubgraphNFT>;
}

export type SubgraphNFT = {
  id: string
  contractAddress: string
  tokenId: BigInt
  createdAtBlockNumber: string
  createdAtTimestamp: string
  platform: MusicPlatform
  track: {
    id: string
  }
}

const QUERIES = {
  getRecordsFrom: (timestamp: string) => gql`
  {
    nfts(where:{createdAtTimestamp_gte:${timestamp}}, orderBy:createdAtTimestamp, orderDirection: asc, first:${process.env.SUBGRAPH_QUERY_LIMIT}) {
      id
      contractAddress
      tokenId
      platform
      track{id}
      createdAtTimestamp
      createdAtBlockNumber
    }
  }`,
  getRecordsAtBlock: (block: string) => gql`
  {
    nfts(where:{createdAtBlockNumber:${block}}, orderBy: createdAtTimestamp, first:${process.env.SUBGRAPH_QUERY_LIMIT}) {
      id
      contractAddress
      tokenId
      platform
      track{id}
      createdAtTimestamp
      createdAtBlockNumber
    }
  }`,
  getLatestRecord: () => gql`
  {
    nfts(orderBy: createdAtTimestamp, orderDirection: desc, first: 1) {
      id
      contractAddress
      tokenId
      platform
      track{id}
      createdAtTimestamp
      createdAtBlockNumber
    }
  }`,
};

export const recordsEqual = (recordA: SubgraphNFT, recordB: SubgraphNFT) => recordA.id == recordB.id;

const recordIsInBatch = (record: SubgraphNFT, batch: SubgraphNFT[]) => {
  const match = batch.find((batchRecord: SubgraphNFT) => recordsEqual(batchRecord, record));
  return !!match;
};

const init = (endpoint: string) => {
  const getRecordsFrom = async (timestamp: string) => {
    const fromResponseData = await request(endpoint, QUERIES.getRecordsFrom(timestamp));
    const nextRecordBatch = fromResponseData[`nfts`];

    if (nextRecordBatch.length < process.env.SUBGRAPH_QUERY_LIMIT!) {
      return nextRecordBatch;
    }

    // We also need to get all records in the last block of a batch to ensure we do not miss
    // when multiple records are created in a single block and the cursor on the first query
    // does not include them all.
    const lastBlockInBatch = nextRecordBatch[nextRecordBatch.length - 1].createdAtBlockNumber;
    const blockResponseData = await request(endpoint, QUERIES.getRecordsAtBlock(lastBlockInBatch));
    const lastBlockRecords = blockResponseData[`nfts`];
    const extraRecords = lastBlockRecords.filter((record: SubgraphNFT) => !recordIsInBatch(record, nextRecordBatch));
    const allRecords = nextRecordBatch.concat(...extraRecords);

    return allRecords;
  };
  const getLatestRecord = async (): Promise<SubgraphNFT> => {
    const data = await request(endpoint, QUERIES.getLatestRecord());
    return data[`nfts`][0];
  };
  const getNFTsFrom = async (timestamp: string): Promise<SubgraphNFT[]> => {
    return getRecordsFrom(timestamp);
  };
  const getLatestNFT = async () => {
    return getLatestRecord() as Promise<SubgraphNFT>;
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
