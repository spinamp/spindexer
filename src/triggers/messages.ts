
import { Table } from '../db/db';
import { CrdtMessage, CrdtOperation } from '../types/message';
import { Cursor, Trigger } from '../types/trigger';

export const pendingMempoolInsertMessages: (tables: string) => Trigger<undefined> = 
  (table) => {
    return async (clients) => {
      // join crdtState on messages so that
      // each message can be compared with the last updated time and value to resolve conflicts
      // each message is joined to crdtState via the keys in the data object
      const sql = `
      select rm.id, 
      rm."timestamp",
      rm."table",
      column_key as "column",
      rm."data"->>column_key as value,
      rm."data"->>'id' as "entityId",
      rm.operation , 
      rcs."lastTimestamp",
      rcs.value as "lastValue"
      from (
        select * from ${Table.mempool} 
        where "table" = '${table}'
        and operation = '${CrdtOperation.UPSERT}'
        limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
      ) as rm 
      cross join jsonb_object_keys(rm."data") column_key
      left outer join ${Table.crdtState} rcs
      on rm."table" = rcs."table" 
      and column_key = rcs."column"
      and rm."data"->>'id' = rcs."entityId"
      where column_key != 'id'
      order by rm."table", column_key, rm."data"->>'id', rm.timestamp
      `

      const result = await clients.db.rawSQL(sql);
      return result.rows;
    }
  }

export const pendingMempoolUpdateMessages: (tables: string) => Trigger<undefined> = 
  (table) => {
    return async (clients) => {
      // each message has a 'data' field which is an object where the keys reference columns in the target table.
      // join the message with the table that the message references so
      // messages can be ignored if the referenced id doesn't exist.
      // additionally join the crdtState on the keys of 'data' so that we can include the last processed timestamp and value for each column.
      // the last processed timestamp can be used in the processor to determine if pending messages are fresh or stale
      // and the values can be used to resolve timestamp conflicts via string sort
      const sql = `
      select 
      rm.id, 
      rm."timestamp",
      rm."table",
      column_key as "column",
      rm."data"->>column_key as value,
      rm."data"->>'id' as "entityId",
      rm.operation,
      rcs."lastTimestamp",
      rcs.value as "lastValue"
      from (
        select *
        from ${Table.mempool}
        where "table" = '${table}'
        and operation = '${CrdtOperation.UPDATE}'
        limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
      ) as rm
      left outer join ${table} t
      on rm."data"->>'id' = t.id
      cross join jsonb_object_keys(rm."data") column_key
      left outer join ${Table.crdtState} rcs 
      on rm."table" = rcs."table"
      and column_key = rcs."column" 
      and rm."data"->>'id' = rcs."entityId" 
      where t.id is not null
      and column_key != 'id'
      order by rm."table", rm."data"->>'id', rm."timestamp"
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
