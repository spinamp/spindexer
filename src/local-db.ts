import { promises as fs } from 'fs';

import { Record, DBClient } from './db';

const DB_FILE = process.cwd() + '/localdb/db.json';
const INITIAL_DB = {
  lastProcessedBlock: process.env.GLOBAL_STARTING_BLOCK,
  nfts: [],
  artists: [],
  tracks: [],
  indexes: {
    nfts: {},
    artists: {},
    tracks: {},
  }
};

const loadDB = async () => {
  try {
    const data = await fs.readFile(DB_FILE);
    return JSON.parse(data.toString());
  } catch (error: any) {
    if (error.code && error.code === 'ENOENT') {
      const data = await createDB();
      return data;
    } else {
      throw error;
    }
  };
}

const createDB = async () => {
  await saveDB(INITIAL_DB);
  return INITIAL_DB;
};

const saveDB = async (contents: any) => {
  await fs.writeFile(DB_FILE, JSON.stringify(contents));
};

const init = async (): Promise<DBClient> => {
  const db = await loadDB();
  return {
    getLastProcessedBlock: async () => {
      return parseInt(db.lastProcessedBlock);
    },
    update: async (tableName: string, rows: Record[], newProcessedDBBlock: Number) => {
      const table = db[tableName];
      const index = db.indexes[tableName];
      rows.forEach((row: Record) => {
        index[row.id] = row;
        return row;
      });
      table.push(...rows);
      db.lastProcessedBlock = newProcessedDBBlock;
      await saveDB(db);
    },
    getNumberTracks: () => {
      return db.tracks.length;
    },
    trackExists: (trackID: string) => {
      return Promise.resolve(!!(db.indexes.tracks[trackID]));
    }
  };
}

export default {
  init
};
