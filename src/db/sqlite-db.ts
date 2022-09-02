import _ from 'lodash';
import { connect, Trilogy } from 'trilogy'

import { Cursor } from '../types/trigger';

import { DBClient, Table, Wheres, QueryOptions } from './db';
import { fromDBRecords, toDBRecords } from './orm';

const loadDB = async () => {

  //Create the database
  const db = await connect(':memory:', {
    client: 'sql.js'
  })


  const games = await db.model('games', {
    name: { type: String },
    genre: String, // type shorthand
    released: Date,
    awards: Array,
    id: 'increments' // special type, primary key
  })

  await games.create({
    name: 'Overwatch',
    genre: 'FPS',
    released: new Date('May 23, 2016'),
    awards: [
      'Game of the Year',
      'Best Multiplayer Game',
      'Best ESports Game'
    ]
  })

  const overwatch = await games.findOne({ name: 'Overwatch' })

  console.log((overwatch!.awards as any)[1])

  // await db.knex.migrate.latest();
  return db;
}

const recordExistsFunc = (db: Trilogy) => async (tableName: string, recordID: string, idField = 'id') => {
  console.log(`Querying for record ${recordID} on ${tableName}`);
  const record = await db.knex(tableName).where(idField, recordID)
  return !!record[0];
}

const filterExistRecordsFunc = (db: Trilogy) => async (tableName: string, recordIDs: string[], idField = 'id') => {
  console.log(`Querying for new records in ${recordIDs} on ${tableName}`);
  const existingIdsSelect = await db.knex(tableName).select([idField]).whereIn(idField, recordIDs)
  return existingIdsSelect.map(i => i.id);
}

const getRecordsFunc = (db: Trilogy) => async <RecordType>(tableName: string, wheres?: Wheres): (Promise<RecordType[]>) => {
  console.log(`Querying for records in ${tableName}: ${JSON.stringify(wheres) || 'all'}`);
  let query = db.knex('games');
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
      const cursorResult = await db.knex(Table.processors).where('id', processor).select('cursor');
      return cursorResult[0]?.cursor;
    },
    recordExists: recordExistsFunc(db),
    recordsExist: filterExistRecordsFunc(db),
    insert: async <RecordType>(tableName: string, records: RecordType[], options?: QueryOptions) => {
      if (records.length === 0) {
        return;
      }
      console.log(`Inserting into ${tableName} ${records.length} records`);
      const dbRecords = toDBRecords(tableName, records);
      await db.knex.transaction(async (transaction: any) => {
        const chunks = _.chunk(dbRecords, Number.parseInt(process.env.MAX_INSERT_CHUNK_SIZE!));

        await Promise.all(
          chunks.map(async chunk => {
            if (options?.ignoreConflict){
              await transaction.insert(chunk).into(tableName).onConflict(options.ignoreConflict as any).ignore();
            } else {
              await transaction.insert(chunk).into(tableName);
            }
          })
        )

      })
    },
    updateProcessor: async (processor: string, lastCursor: Cursor) => {
      console.log(`Updating ${processor} with cursor: ${lastCursor}`);
      const processorExists = await recordExistsFunc(db)(Table.processors, processor);
      if (processorExists) {
        await db.knex(Table.processors).where('id', processor).update(
          { cursor: lastCursor }
        );
      } else {
        await db.knex(Table.processors).insert(
          { id: processor, cursor: lastCursor }
        );
      }
    },
    getNumberRecords: async (tableName: string) => {
      console.log(`Querying for count on ${tableName}`);
      const count = await db.knex(tableName).count({ count: '*' })
      return count[0].count;
    },
    getRecords: getRecordsFunc(db),
    rawSQL: async (raw: string) => {
      console.log(`Querying for ${raw}`);
      return await db.knex.raw(raw);
    },
    rawBoundSQL: async (raw: string, bindings: any[]) => {
      console.log(`Querying for ${raw} with bindings`);
      return await db.knex.raw(raw, ...bindings);
    },
    getDB: () => db as any,
    update: async <RecordType>(tableName: string, recordUpdates: RecordType[], idField = 'id') => {
      console.log(`Updating records`);
      if (recordUpdates?.length > 0) {
        const dbUpdates = toDBRecords(tableName, recordUpdates)
        for (const dbUpdate of dbUpdates) {
          const id = (dbUpdate as any)[idField];
          const changes: any = { ...dbUpdate }
          delete changes.id

          await db.knex(tableName).where(idField, id).update(changes)
        }
      }
    },
    delete: async (tableName: string, ids: string[], idField = 'id') => {
      console.log(`Deleting records`);
      if (ids?.length > 0) {
        await db.knex(tableName).whereIn(idField, ids).delete()
      }
    },
    upsert: async <RecordType>(tableName: string, recordUpserts: RecordType[], idField: string | string[] = 'id', mergeOptions: string[] | undefined = undefined ) => {
      throw new Error('not yet supported');
      // console.log(`Upserting records`);
      // if (recordUpserts?.length > 0) {
      //   const dbUpserts = toDBRecords(tableName, recordUpserts)
      //   for (const dbUpsert of dbUpserts) {
      //     // exclude the default timestamp column unless explicitly specified in mergeOptions
      //     if (mergeOptions === undefined) {
      //       mergeOptions = Object.keys(dbUpsert).filter((value) => { return value !== defaultTimestampColumn });
      //     }
      //     try {
      //       await db.knex(tableName)
      //         .insert(dbUpsert)
      //         .onConflict(idField as any)
      //         .merge(mergeOptions)
      //     } catch (error) {
      //       console.error('Error upsert record:');
      //       console.dir({ dbUpsert }, { depth: null });
      //       throw error;
      //     }
      //   }
      // }
    },
    close: async () => {
      return await db.knex.destroy();
    }
  });
}

export default {
  init
};
