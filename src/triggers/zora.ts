import { Table } from '../db/db';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';
import { ZORA_CONTRACT_ADDRESS } from '../types/zora-contract';

export const zoraNFTs: Trigger<undefined> = async (clients: Clients) => {
  const nfts = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['where', [{ contractAddress: ZORA_CONTRACT_ADDRESS }]],
      ['and'],
      ['whereNotNull', ['metadata']],
      ['and'],
      ['whereNull', ['metadataError']],
      ['and'],
      ['whereNull', ['platformId']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};
