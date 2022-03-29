import { promises as fs } from 'fs';

const DB_FILE = process.cwd() + '/localdb/db.json';
const GLOBAL_STARTING_BLOCK = 11565019;

type Track = {}

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
  const initialDB = { lastProcessedBlock: GLOBAL_STARTING_BLOCK, tracks: [], artists: [] };
  await saveDB(initialDB);
  return initialDB;
};

const saveDB = async (contents: any) => {
  await fs.writeFile(DB_FILE, JSON.stringify(contents));
};

const init = async () => {
  const db = await loadDB();
  return {
    getLastProcessedBlock: async () => {
      return parseInt(db.lastProcessedBlock);
    },
    update: async (tableName: string, rows: Track[], newProcessedDBBlock: Number) => {
      const table = db[tableName];
      rows.forEach((row: Track) => {
        return row;
      });
      table.push(...rows);
      db.lastProcessedBlock = newProcessedDBBlock;
      await saveDB(db);
    },
    getNumberTracks: () => {
      return db.tracks.length;
    }
  };
}

export default {
  init
};
