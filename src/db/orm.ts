import { MetaFactory } from '../types/metaFactory';
import { NFT, NftFactory, NFTStandard } from '../types/nft';
import { NFTProcessError } from '../types/nftProcessError';
import { IdField, Record, RecordUpdate } from '../types/record';

import { Table } from './db';

const toDBRecord = <RecordType>(record: RecordType | RecordUpdate<unknown>) => {
  if ((record as any).createdAtTime) {
    return { ...record, createdAtTime: (record as any).createdAtTime.toISOString() };
  } else {
    return record;
  }
}

const toRecordMapper: any = {
  [Table.nftFactories]: (erc721Contracts: NftFactory[]): IdField[] => erc721Contracts.map((c) => {
    return ({
      id: c.standard === NFTStandard.METAPLEX ? c.id : c.id.toLowerCase(), // solana addresses are base58 encoded so are case sensitive
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      name: c.name,
      symbol: c.symbol,
      typeMetadata: c.typeMetadata,
      standard: c.standard,
      autoApprove: c.autoApprove,
      approved: c.approved
    });
  }),
  [Table.metaFactories]: (factoryContracts: MetaFactory[]): IdField[] => factoryContracts.map((c) => {
    return ({
      id: c.standard === NFTStandard.METAPLEX ? c.id : c.id.toLowerCase(), // solana addresses are base58 encoded so are case sensitive
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      gap: c.gap,
      standard: c.standard,
      autoApprove: c.autoApprove
    });
  }),
  [Table.nftProcessErrors]: (nftProcessErrors: NFTProcessError[]):
  { nftId: string; metadataError?: string; numberOfRetries?: number; lastRetry?: string; processError?: string }[] => nftProcessErrors.map((error) => {
    return ({
      nftId: error.nftId,
      metadataError: error.metadataError,
      numberOfRetries: error.numberOfRetries,
      lastRetry: error.lastRetry ? error.lastRetry.toISOString() : undefined,
      processError: error.processError
    });
  }),
}

export const toDBRecords = <RecordType>(tableName: string, records: (RecordType | RecordUpdate<unknown>)[]) => {
  const dbRecords = records.map(record => toDBRecord(record));
  if (toRecordMapper[tableName]) {
    return toRecordMapper[tableName](records);
  }
  return dbRecords;
}

const fromRecordMapper: any = {
  [Table.nfts]: (nfts: Record[]): NFT[] => nfts.map((n: any) => {
    const metadata = typeof n.metadata === 'object' ? n.metadata : JSON.parse(n.metadata);
    return ({ ...n, metadata });
  }),
  [Table.nftFactories]: (erc721Contracts: Record[]): NftFactory[] => erc721Contracts.map((c: any) => {
    return ({
      id: c.id,
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      name: c.name,
      symbol: c.symbol,
      typeMetadata: c.typeMetadata,
      standard: c.standard,
      autoApprove: c.autoApprove,
      approved: c.approved
    });
  }),
  [Table.metaFactories]: (factoryContracts: Record[]): MetaFactory[] => factoryContracts.map((c: any) => {
    return ({
      id: c.id,
      platformId: c.platformId,
      startingBlock: c.startingBlock,
      contractType: c.contractType,
      gap: c.gap,
      standard: c.standard,
      autoApprove: c.autoApprove
    });
  }),
  [Table.nftProcessErrors]: (errors: Record[]): NFTProcessError[] => errors.map((error: any) => {
    return ({
      ...error,
      lastRetry: error.lastRetry ? new Date(error.lastRetry) : null
    });
  }),
}

export const fromDBRecord = (record: any): Record => {
  return { ...record, createdAtTime: record.createdAtTime ? new Date(record.createdAtTime) : null }
}

export const fromDBRecords = (tableName: string, dbRecords: any[]) => {
  const records: Record[] = dbRecords.map(fromDBRecord);
  if (fromRecordMapper[tableName]) {
    return fromRecordMapper[tableName](records);
  }
  return records;
}
