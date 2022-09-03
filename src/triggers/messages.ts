import { BigNumber } from 'ethers';
import _ from 'lodash';

import { Table } from '../db/db';
import { CrdtMessage } from '../types/message';
import { Trigger } from '../types/trigger';


export const newMessages: Trigger<undefined> = async (clients) => {
  // get all unprocessed messages
  const selectSql = `select m.* from ${Table.crdtMessages} m
  left outer join ${Table.processedMessages} pm 
  on m."timestamp" = pm."messageId" 
  where pm."messageId" is null
  order by m."timestamp"::numeric 
  limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}  
  `
  const unprocessedMessages: CrdtMessage[] = (await clients.db.rawSQL(selectSql)).rows;

  if (unprocessedMessages.length === 0) {
    return []
  }

  // group by table, column and id
  const uniqueTables = _.uniq(unprocessedMessages.map(message => message.table))
  const uniqueColumns = _.uniq(unprocessedMessages.map(message => message.column))
  const uniqueIds = _.uniq(unprocessedMessages.map(message => message.entityId))

  const newestFieldUpdateTimesSql = `
  select max("messageId"::numeric), "table", "column", "entityId"
  from raw_processed_messages rpm 
  where "table" in (${uniqueTables.map(table => `'${table}'`)})
  and "column" in (${uniqueColumns.map(col => `'${col}'`)})
  and "entityId" in (${uniqueIds.map(id => `'${id}'`)})
  group by "table", "column", "entityId"
  `
  const newestFieldUpdates = (await clients.db.rawSQL(newestFieldUpdateTimesSql)).rows
  const lastUpdatedTimeByField = _.keyBy(newestFieldUpdates, update => `${update.table}.${update.column}.${update.entityId}`)

  // filter out older messages
  const newestMessages = unprocessedMessages.filter(message => {
    const newestUpdatedTime = lastUpdatedTimeByField[`${message.table}.${message.column}.${message.entityId}`]?.max;
    if (!newestUpdatedTime){
      return true
    }

    return BigNumber.from(message.timestamp).gt(newestUpdatedTime)
  })

  return newestMessages
};
