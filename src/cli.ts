import 'dotenv/config';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { DBClient } from './db/db';
import dbLib from './db/local-db';
import { Track } from './types/tracks';


const logMetadataDups = async (dbClient: DBClient) => {
  const { db, indexes } = await dbClient.getFullDB();
  const metadataFixedTracks = findMetadataDups(db.tracks);
  console.dir(metadataFixedTracks, { depth: null });
}

const findMetadataDups = (tracks: Track[]) => {
  return tracks.filter(t => t.metadata && t.metadataError);
}

const findTimeoutErrorTracks = (tracks: Track[]) => {
  return tracks.filter(t => t.metadataError && t.metadataError.includes('timeout') && t.metadataError.includes('exceeded'));
}

const clearFixedMetadataErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const metadataFixedTracks = findMetadataDups(db.tracks);
  const updates = metadataFixedTracks.map(t => ({ id: t.id, metadataError: undefined }));
  dbClient.update('tracks', updates);
}

const printMissingIPFS = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  console.log(db.tracks.filter((t: Track) => !t.metadataIPFSHash));
}

const printMetadataErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  console.log(db.tracks.filter((t: Track) => t.metadataError));
}

const clearTimeoutErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const timeoutErrorTracks = findTimeoutErrorTracks(db.tracks);
  const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
  dbClient.update('tracks', updates);
}

yargs(hideBin(process.argv))
  .command('printMissingIPFS', 'print all ipfs hashes', (yargs) => {
    return yargs
  }, () => {
    printMissingIPFS();
  })
  .command('printMetadataErrors', 'print all tracks with metadata errors', (yargs) => {
    return yargs
  }, () => {
    printMetadataErrors();
  })
  .command('clearFixedMetadataErrors', 'print all tracks with metadata errors', (yargs) => {
    return yargs
  }, () => {
    clearFixedMetadataErrors();
  })
  .command('clearTimeoutErrors', 'print all tracks with metadata errors', (yargs) => {
    return yargs
  }, () => {
    clearTimeoutErrors();
  })
  .parse()
