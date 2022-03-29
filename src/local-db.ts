import { promises as fs } from 'fs';

const DB_FILE = process.cwd() + '/localdb/db.json';
const GLOBAL_STARTING_BLOCK = 11565019;

type Record = {}

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
  const initialDB = { lastProcessedBlock: GLOBAL_STARTING_BLOCK, nfts: [], artists: [], tracks: [] };
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
    update: async (tableName: string, rows: Record[], newProcessedDBBlock: Number) => {
      const table = db[tableName];
      rows.forEach((row: Record) => {
        return row;
      });
      table.push(...rows);
      db.lastProcessedBlock = newProcessedDBBlock;
      await saveDB(db);
    },
    getNumberNFTs: () => {
      return db.nfts.length;
    }
  };
}

export default {
  init
};
