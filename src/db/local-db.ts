import { promises as fs } from 'fs';

import { Record, DBClient, Query } from './db';

const DB_FILE = process.cwd() + '/localdb/db.json';
const INITIAL_DB = {
  nfts: [],
  artists: [],
  tracks: [],
  processors: {
    createTracksFromNFTs: {
      cursor: process.env.GLOBAL_STARTING_BLOCK,
    },
    addTrackMetadata: {},
  },
};

const INITIAL_INDEXES = {
  nfts: {},
  artists: {},
  tracks: {},
};

const createIndexes = async (db: any) => {
  const indexes: any = {};
  const tableNames = Object.keys(INITIAL_INDEXES);
  for (const tableName of tableNames) {
    indexes[tableName] = {};
    const index = indexes[tableName];
    const records = db[tableName];
    records.forEach((record: Record) => {
      index[record.id] = record;
      return record;
    });
  }
  return indexes;
};

const loadDB = async () => {
  try {
    const data = await fs.readFile(DB_FILE);
    const db = JSON.parse(data.toString());
    const indexes = await createIndexes(db);
    return {
      db,
      indexes
    };
  } catch (error: any) {
    if (error.code && error.code === 'ENOENT') {
      const db = await createDB();
      return { db, indexes: INITIAL_INDEXES };
    } else {
      throw error;
    }
  };
}

const createDB = async () => {
  await saveDB(INITIAL_DB);
  return INITIAL_DB;
};

const saveDB = async (db: any) => {
  await fs.writeFile(DB_FILE, JSON.stringify(db));
};

const init = async (): Promise<DBClient> => {
  const { db, indexes } = await loadDB();
  return {
    getCursor: async (processor: string): Promise<(number | undefined)> => {
      return parseInt(db.processors[processor].cursor);
    },
    getRecords: async (tableName: string, query?: Query): (Promise<Record[]>) => {
      const allRecords = db[tableName]
      if (query) {
        return allRecords.filter((record: Record) => record[query.where.key as keyof Record] === query.where.value);
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
    updateProcessor: async (processor: string, newProcessedDBBlock: Number) => {
      db.processors[processor].cursor = newProcessedDBBlock;
      await saveDB(db);
    },
    getNumberRecords: (tableName: string) => {
      return db[tableName].length;
    },
    recordExists: (tableName: string, recordID: string) => {
      return Promise.resolve(!!(indexes[tableName][recordID]));
    }
  };
}

export default {
  init
};
