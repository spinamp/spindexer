import knex, { Knex } from 'knex';
import { Record, DBClient, Wheres, WhereFunc } from './db';
import _ from 'lodash';
import { Cursor } from '../types/trigger';
import config from './knexfile';

const loadDB = async () => {
  const currentConfig = config[process.env.NODE_ENV]
  const db = knex(currentConfig);
  await db.migrate.latest();
  return db;
}

const recordExistsFunc = (db: Knex) => async (tableName: string, recordID: string) => {
  console.log(`Querying for record ${recordID} on ${tableName}`);
  const record = await db(tableName).where('id', recordID)
  return !!record[0];
}

const init = async (): Promise<DBClient> => {
  const db = await loadDB();
  return ({
    getCursor: async (processor: string): Promise<(string | undefined)> => {
      console.log(`Querying for processor cursor`);
      const cursorResult = await db('processors').where('id', processor).select('cursor');
      return cursorResult[0]?.cursor;
    },
    recordExists: recordExistsFunc(db),
    insert: async (tableName: string, records: Record[]) => {
      console.log(`Inserting into ${tableName} ${records.length} records`);
      if (records.length === 0) {
        return;
      }
      await db(tableName).insert(records);
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
    getRecords: async <RecordType extends Record>(tableName: string, wheres?: Wheres): (Promise<RecordType[]>) => {
      console.log(`Querying for records where ${wheres}`);
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
      const records = await query;
      return records;
    },
    update: async (tableName: string, recordUpdates: Record[]) => {
      console.log(`Updating records`);
      if (recordUpdates) {
        for (const update of recordUpdates) {
          const id = update.id;
          const changes: any = { ...update }
          delete changes.id
          await db(tableName).where('id', id).update(changes)
        }
      }
    },
    close: async () => {
      return await db.destroy();
    }
  } as any);
}

export default {
  init
};

/*

const init = async (): Promise<DBClient> => {
  let { db, indexes } = await loadDB();
  return {
    getRecord: async (tableName: string, id: string): (Promise<Record>) => {
      return indexes[tableName] && indexes[tableName][id];
    },
    insert: async (tableName: string, records: Record[]) => {
      const table = db[tableName];
      const index = indexes[tableName];
      records.forEach((record: Record) => {
        table.push(record);
        index[record.id] = record;
      });
      await saveDB(db);
    },
    upsert: async (tableName: string, recordUpserts: Record[]) => {
      const index = indexes[tableName];
      const table = db[tableName];
      recordUpserts.forEach((upsert: Record) => {
        const existingRecord = index[upsert.id];
        if (existingRecord) {
          Object.assign(existingRecord, { ...upsert });
        } else {
          table.push(upsert);
          index[upsert.id] = upsert;
        }
      });
      await saveDB(db);
    },
    delete: async (tableName: string, ids: string[]) => {
      const records = db[tableName];
      const newRecords = records.filter((r: Record) => !ids.includes(r.id));
      db[tableName] = newRecords;
      await saveDB(db);
      indexes = await createIndexes(db);
    },
    recordExists: async (tableName: string, recordID: string) => {
      return Promise.resolve(!!(indexes[tableName][recordID]));
    },
    getFullDB: async () => {
      return { db, indexes };
    }
  };
}

export default {
  init
};

*/
