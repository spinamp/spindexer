import knex, { Knex } from 'knex';
import _ from 'lodash';

import { Record } from '../types/record';
import { RecordUpdate } from '../types/record';
import { Cursor } from '../types/trigger';

import { DBClient, Wheres } from './db';
import config from './knexfile';
import { fromDBRecords, toDBRecords } from './orm';

const loadDB = async () => {
  const currentConfig = config[process.env.NODE_ENV]
  const initialConfig = { ...currentConfig, connection: { ...currentConfig.connection, database: 'postgres' } };
  const initialDB = knex(initialConfig);
  const { rowCount } = await initialDB.raw(`SELECT 1 FROM pg_database WHERE datname='${process.env.POSTGRES_DATABASE}'`);
  if (rowCount === 0) {
    await initialDB.raw(`CREATE DATABASE ${process.env.POSTGRES_DATABASE};`);
  }
  await initialDB.destroy();
  const db = knex(currentConfig);
  await db.migrate.latest();
  return db;
}

const recordExistsFunc = (db: Knex) => async (tableName: string, recordID: string, idField = 'id') => {
  console.log(`Querying for record ${recordID} on ${tableName}`);
  const record = await db(tableName).where(idField, recordID)
  return !!record[0];
}

const filterExistRecordsFunc = (db: Knex) => async (tableName: string, recordIDs: string[], idField = 'id') => {
  console.log(`Querying for new records in ${recordIDs} on ${tableName}`);
  const existingIdsSelect = await db(tableName).select([idField]).whereIn(idField, recordIDs)
  return existingIdsSelect.map(i => i.id);
}

const getRecordsFunc = (db: Knex) => async <RecordType>(tableName: string, wheres?: Wheres): (Promise<RecordType[]>) => {
  console.log(`Querying for records in ${tableName}: ${JSON.stringify(wheres) || 'all'}`);
  let query = db(tableName);
  if (wheres) {
    wheres.forEach(where => {
      const queryField = where[0];
      if (queryField === 'and') {
        query = query[queryField];
      } else {
        query = (query[queryField] as any)(...where[1])
      }
    })
  }
  const dbRecords = await query;
  return fromDBRecords(tableName, dbRecords);
}

const init = async (): Promise<DBClient> => {
  const db = await loadDB();
  return ({
    getCursor: async (processor: string): Promise<(string | undefined)> => {
      console.log(`Querying for processor cursor for ${processor}`);
      const cursorResult = await db('processors').where('id', processor).select('cursor');
      return cursorResult[0]?.cursor;
    },
    recordExists: recordExistsFunc(db),
    recordsExist: filterExistRecordsFunc(db),
    insert: async <RecordType>(tableName: string, records: RecordType[]) => {
      if (records.length === 0) {
        return;
      }
      console.log(`Inserting into ${tableName} ${records.length} records`);
      const dbRecords = toDBRecords(tableName, records);
      await db(tableName).insert(dbRecords);
    },
    updateProcessor: async (processor: string, lastCursor: Cursor) => {
      console.log(`Updating ${processor} with cursor: ${lastCursor}`);
      const processorExists = await recordExistsFunc(db)('processors', processor);
      if (processorExists) {
        await db('processors').where('id', processor).update(
          { cursor: lastCursor }
        );
      } else {
        await db('processors').insert(
          { id: processor, cursor: lastCursor }
        );
      }
    },
    getNumberRecords: async (tableName: string) => {
      console.log(`Querying for count on ${tableName}`);
      const count = await db(tableName).count({ count: '*' })
      return count[0].count;
    },
    getRecords: getRecordsFunc(db),
    rawSQL: async (raw: string) => {
      console.log(`Querying for ${raw}`);
      return await db.raw(raw);
    },
    update: async <RecordType>(tableName: string, recordUpdates: RecordType[], idField = 'id') => {
      console.log(`Updating records`);
      if (recordUpdates?.length > 0) {
        const dbUpdates = toDBRecords(tableName, recordUpdates)
        for (const dbUpdate of dbUpdates) {
          const id = (dbUpdate as any)[idField];
          const changes: any = { ...dbUpdate }
          delete changes.id

          await db(tableName).where(idField, id).update(changes)
        }
      }
    },
    delete: async (tableName: string, ids: string[], idField = 'id') => {
      console.log(`Deleting records`);
      if (ids?.length > 0) {
        await db(tableName).whereIn(idField, ids).delete()
      }
    },
    upsert: async <RecordType>(tableName: string, recordUpserts: RecordType[], idField: string | string[] = 'id') => {
      console.log(`Upserting records`);
      if (recordUpserts?.length > 0) {
        const dbUpserts = toDBRecords(tableName, recordUpserts)
        for (const dbUpsert of dbUpserts) {
          await db(tableName)
            .insert(dbUpsert)
            .onConflict(idField as any)
            .merge()
        }
      }
    },
    close: async () => {
      return await db.destroy();
    }
  });
}

export default {
  init
};
