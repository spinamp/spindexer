
import { Table } from '../db/db';
import { CrdtMessage, CrdtOperation } from '../types/message';
import { Cursor, Trigger } from '../types/trigger';

export const pendingMempoolMessages: (tables: string) => Trigger<undefined> = 
  (table) => {
    return async (clients) => {
      const sql = `
      select rm.*, rcs."lastTimestamp"
      from raw_mempool rm 
      left outer join ${table} t 
      on rm."entityId" = t.id
      left outer join ${Table.crdtState} rcs
      on rm."table" = rcs."table" 
      and rm."column" = rcs."column" 
      and rm."entityId" = rcs."entityId"
      where rm."table" = '${table}'
      and ((rm.operation = '${CrdtOperation.UPDATE}' and t.id is not null) or rm.operation = '${CrdtOperation.INSERT}')
      order by rm."table", rm."column", rm."entityId", rm.timestamp
      `;

      const result = await clients.db.rawSQL(sql);
      return result.rows;
    }
  }

export const newSeedMessages: Trigger<Cursor> = async (clients, cursor: string) => {
  const selectSql = `select m.* from ${Table.seeds} m
  where id > ${parseInt(cursor)}
  order by id
  limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
  `
  const unprocessedMessages: CrdtMessage[] = (await clients.db.rawSQL(selectSql)).rows;

  if (unprocessedMessages.length === 0) {
    return []
  }

  const newCursor = unprocessedMessages[unprocessedMessages.length - 1].id!

  return { items: unprocessedMessages, newCursor };
};
