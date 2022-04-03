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

const findIPFSProtocolErrorTracks = (tracks: Track[]) => {
  return tracks.filter(t => t.metadataError && t.metadataError.includes('Cannot read properties of null'));
}

const findECONNREFUSEDErrorTracks = (tracks: Track[]) => {
  return tracks.filter(t => t.metadataError && t.metadataError.includes('connect ECONNREFUSED'));
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

const clearIPFSProtocolErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const timeoutErrorTracks = findIPFSProtocolErrorTracks(db.tracks);
  const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
  dbClient.update('tracks', updates);
}

const clearECONNREFUSEDErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const timeoutErrorTracks = findECONNREFUSEDErrorTracks(db.tracks);
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
  .command('clearFixedMetadataErrors', 'clear out metadata errors from tracks that have has metadata successfully added', (yargs) => {
    return yargs
  }, () => {
    clearFixedMetadataErrors();
  })
  .command('clearTimeoutErrors', 'clear out metadata errors from tracks with timeout errors', (yargs) => {
    return yargs
  }, () => {
    clearTimeoutErrors();
  })
  .command('clearIPFSProtocolErrors', 'clear out metadata errors from tracks with ipfs protocol url errors', (yargs) => {
    return yargs
  }, () => {
    clearIPFSProtocolErrors();
  })
  .command('clearECONNREFUSEDErrors', 'clear out metadata errors from tracks with ECONNREFUSED errors', (yargs) => {
    return yargs
  }, () => {
    clearECONNREFUSEDErrors();
  })
  .command('clearStaleErrors', 'clear out metadata errors that are stale and should be retried from tracks', (yargs) => {
    return yargs
  }, () => {
    clearFixedMetadataErrors();
    clearTimeoutErrors();
    clearIPFSProtocolErrors();
    clearECONNREFUSEDErrors();
  })
  .parse()
