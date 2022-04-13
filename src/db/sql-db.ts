import knex, { Knex } from 'knex';
import { promises as fs } from 'fs';
import { Record, DBClient, Query, Where, ValueIsWhere, ValueInWhere } from './db';
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
    getRecords: async <RecordType extends Record>(tableName: string, query?: Query): (Promise<RecordType[]>) => {
      const allRecords = db[tableName]
      if (query) {
        let filteredRecords = allRecords;
        if (Array.isArray(query.where)) {
          filteredRecords = filteredRecords.filter((record: RecordType) => {
            let matched;
            if (query.whereType === 'or') {
              matched = false;
            } else {
              matched = true;
            }
            for (const filter of (query.where as Array<Where>)) {
              let match;
              if ((filter as ValueIsWhere).value) {
                match = _.get(record, filter.key) === (filter as any).value;
              } else if ((filter as ValueInWhere).valueIn) {
                const matchValues = (filter as ValueInWhere).valueIn;
                const recordValue = _.get(record, filter.key);
                match = matchValues.includes(recordValue);
              }
              else {
                const valueExists = !(_.get(record, filter.key) === undefined)
                match = valueExists === (filter as any).valueExists;
              }
              if (query.whereType === 'or') {
                matched = matched || match;
              } else {
                matched = matched && match;
              }
            }
            return matched;
          }
          );
        } else {
          const filter = query.where;
          filteredRecords = allRecords.filter((record: RecordType) => {
            let match;
            if ((filter as ValueIsWhere).value) {
              match = _.get(record, filter.key) === (filter as any).value;
            } else if ((filter as ValueInWhere).valueIn) {
              const matchValues = (filter as ValueInWhere).valueIn;
              const recordValue = _.get(record, filter.key);
              match = matchValues.includes(recordValue);
            } else {
              const valueExists = !(_.get(record, filter.key) === undefined)
              match = valueExists === (filter as any).valueExists;
            }
            return match;
          });
        }
        return filteredRecords;
      }
      return allRecords;
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
    update: async (tableName: string, recordUpdates: Record[]) => {
      const index = indexes[tableName];
      recordUpdates.forEach((update: Record) => {
        const record = index[update.id];
        if (!record) {
          throw new Error('Unknown record provided');
        }
        Object.assign(record, { ...update });
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
