import { Table } from '../db/db';
import { MusicPlatform } from '../types/platform';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

export const zoraNFTs: Trigger<undefined> = async (clients: Clients) => {
  const nfts = (await clients.db.getRecords(Table.erc721nfts,
    [
      ['where', [{ platformId: MusicPlatform.zora }]],
      ['and'],
      ['whereNotNull', ['metadata']],
      ['and'],
      ['whereNull', ['metadataError']],
    ]
  )).slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};
