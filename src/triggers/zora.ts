import { Table } from '../db/db';
import { Trigger } from '../types/trigger';
import { ZORA_CONTRACT_ADDRESS } from '../types/zora-contract';

export const zoraNFTs: Trigger<undefined> = async (clients) => {
  const nftQuery = `select *
  from "${Table.nfts}" en
  left outer join "${Table.nftProcessErrors}" enpe
  on en.id = enpe."nftId"
  where en."contractAddress" = '${ZORA_CONTRACT_ADDRESS}'
  and en.metadata is not null
  and enpe."metadataError" is null
  and en."platformId"='zoraOriginal'
`
  const nfts = (await clients.db.rawSQL(nftQuery))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return nfts;
};
