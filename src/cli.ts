import 'dotenv/config';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { DBClient } from './db/db';
import dbLib from './db/local-db';
import { Track } from './types/tracks';
import prompt from 'prompt';
import _ from 'lodash';
import { MusicPlatform } from './types/platforms';

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
  const metadataFixedTracks = await findMetadataDups(db.tracks);
  const updates = metadataFixedTracks.map(t => ({ id: t.id, metadataError: undefined }));
  await dbClient.update('tracks', updates);
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

const printMimeTypes = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const mimeTypes = db.tracks.map((t: Track) => t.metadata?.mimeType);
  console.log(_.uniq(mimeTypes));
}

const printSoundTracks = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const tracks = db.tracks.filter((t: Track) => t.platform === MusicPlatform.sound).map((t: Track) => t.tokenMetadataURI);
  console.log(tracks);
}

const printZoraNotCatalogTracks = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const tracks = db.tracks.filter((t: Track) => {
    return t.platform === MusicPlatform.zora &&
      !t.metadata?.body?.version?.includes('catalog');
  });
  console.log(tracks);
}

const killMetadataErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const errorTracks = db.tracks.filter((t: Track) => t.metadataError);
  console.dir(errorTracks, { depth: null });
  console.log(`Remove ${errorTracks.length} tracks?`)
  prompt.start();
  prompt.get(['confirm'], async (err, result) => {
    if (result.confirm === 'y') {
      const deletion = errorTracks.map((t: Track) => t.id);
      await dbClient.delete('tracks', deletion);
      console.log('Deleted');
    }
  });
}

const clearTimeoutErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const timeoutErrorTracks = await findTimeoutErrorTracks(db.tracks);
  const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
  await dbClient.update('tracks', updates);
}

const clearIPFSProtocolErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const timeoutErrorTracks = await findIPFSProtocolErrorTracks(db.tracks);
  const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
  await dbClient.update('tracks', updates);
}

const clearECONNREFUSEDErrors = async () => {
  const dbClient = await dbLib.init();
  const { db, indexes } = await dbClient.getFullDB();
  const timeoutErrorTracks = await findECONNREFUSEDErrorTracks(db.tracks);
  const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
  await dbClient.update('tracks', updates);
}

const start = async () => {
  yargs(hideBin(process.argv))
    .command('printMissingIPFS', 'print all tracks with missing ipfs hashes', async (yargs) => {
      return yargs
    }, async () => {
      await printMissingIPFS();
    })
    .command('printMetadataErrors', 'print all tracks with metadata errors', async (yargs) => {
      return yargs
    }, async () => {
      await printMetadataErrors();
    })
    .command('clearFixedMetadataErrors', 'clear out metadata errors from tracks that have has metadata successfully added', async (yargs) => {
      return yargs
    }, async () => {
      await clearFixedMetadataErrors();
    })
    .command('clearTimeoutErrors', 'clear out metadata errors from tracks with timeout errors', async (yargs) => {
      return yargs
    }, async () => {
      await clearTimeoutErrors();
    })
    .command('clearIPFSProtocolErrors', 'clear out metadata errors from tracks with ipfs protocol url errors', async (yargs) => {
      return yargs
    }, async () => {
      await clearIPFSProtocolErrors();
    })
    .command('clearECONNREFUSEDErrors', 'clear out metadata errors from tracks with ECONNREFUSED errors', async (yargs) => {
      return yargs
    }, async () => {
      await clearECONNREFUSEDErrors();
    })
    .command('clearStaleErrors', 'clear out metadata errors that are stale and should be retried from tracks', async (yargs) => {
      return yargs
    }, async () => {
      await clearFixedMetadataErrors();
      await clearTimeoutErrors();
      await clearIPFSProtocolErrors();
      await clearECONNREFUSEDErrors();
    })
    .command('killMetadataErrors', 'clear out tracks that have a metadataError', async (yargs) => {
      return yargs
    }, async () => {
      await killMetadataErrors();
    })
    .command('printMimeTypes', 'print all mime types in metadata in db', async (yargs) => {
      return yargs
    }, async () => {
      await printMimeTypes();
    })
    .command('printSoundTracks', 'print all sound tracks', async (yargs) => {
      return yargs
    }, async () => {
      await printSoundTracks();
    })
    .command('printZoraNotCatalogTracks', 'print all zora tracks that are not from catalog', async (yargs) => {
      return yargs
    }, async () => {
      await printZoraNotCatalogTracks();
    })
    .parse()
}

start();
