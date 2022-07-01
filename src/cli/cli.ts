import 'dotenv/config';
import '../types/env';
import fs from 'fs';
import https from 'https';

import { request, gql } from 'graphql-request';
import _ from 'lodash';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import axios from '../clients/axios';
import { DBClient, Table } from '../db/db';
import { initClients } from '../runner';
import { Clients } from '../types/processor';
import { rollPromises } from '../utils/rollingPromises';

// const logMetadataDups = async (dbClient: DBClient) => {
//   const metadataFixedTracks = findMetadataDups(db.tracks);
//   console.dir(metadataFixedTracks, { depth: null });
// }

// const findMetadataDups = (tracks: Track[]) => {
//   return tracks.filter(t => t.metadata && t.metadataError);
// }

// const findTimeoutErrorTracks = (tracks: Track[]) => {
//   return tracks.filter(t => t.metadataError && t.metadataError.includes('timeout') && t.metadataError.includes('exceeded'));
// }

// const findIPFSProtocolErrorTracks = (tracks: Track[]) => {
//   return tracks.filter(t => t.metadataError && t.metadataError.includes('Cannot read properties of null'));
// }

// const findECONNREFUSEDErrorTracks = (tracks: Track[]) => {
//   return tracks.filter(t => t.metadataError && t.metadataError.includes('connect ECONNREFUSED'));
// }

// const findTracks = (tracks: Track[], filter: any) => {
//   return tracks.filter(track => {
//     const filters = Object.keys(filter)
//     for (const key of filters) {
//       if ((track as any)[key] !== filter[key]) {
//         return false;
//       }
//     }
//     return true;
//   });
// }

// const clearFixedMetadataErrors = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const metadataFixedTracks = await findMetadataDups(db.tracks);
//   const updates = metadataFixedTracks.map(t => ({ id: t.id, metadataError: undefined }));
//   await dbClient.update('tracks', updates);
// }

// const printMissingIPFS = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   console.log(db.tracks.filter((t: Track) => !t.metadataIPFSHash));
// }

// const printMissingMetadata = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   console.log(db.tracks.filter((t: Track) => !t.metadata));
// }

// const printMetadataErrors = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   console.log(db.tracks.filter((t: Track) => t.metadataError));
// }

// const printMimeTypes = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const mimeTypes = db.tracks.map((t: Track) => t.metadata?.mimeType);
//   console.log(_.uniq(mimeTypes));
// }

// const printSoundTracks = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const tracks = db.tracks.filter((t: Track) => t.platformId === MusicPlatform.sound).map((t: Track) => getMetadataURL(t));
//   console.log(tracks);
// }

// const printZoraNotCatalogTracks = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const tracks = db.tracks.filter((t: Track) => {
//     return t.platformId === MusicPlatform.zora &&
//       !t.metadata?.body?.version?.includes('catalog');
//   });
//   console.log(tracks);
// }

// const printFakeCatalogTracks = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const allCatalogTracks = db.tracks.filter((t: Track) => {
//     return t.platformId === MusicPlatform.zora &&
//       t.metadata?.body?.version?.includes('catalog');
//   });
//   const fakeCatalogTracks = allCatalogTracks.filter(((t: Track) => !verifyCatalogTrack(t)));
//   console.log(fakeCatalogTracks);
// }

// const printTracks = async (key: string, value: any) => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const tracks = db.tracks.filter((t: Track) => {
//     return (t as any)[key] === value
//   });
//   console.log(tracks);
//   console.log(`${tracks.length} Tracks`);
// }

// const printProcessedTracks = async (key: string, value: any) => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const processedTracks = db.processedTracks.filter((t: ProcessedTrack) => {
//     return (t as any)[key] === value
//   });
//   console.log(processedTracks);
//   console.log(`${processedTracks.length} Tracks`);
// }

// const printNOIZDDuplicates = async (key: string, value: any) => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const processedTracks = _.filter(_.groupBy(db.processedTracks, 'platformInternalId'), array => array.length > 1);
//   console.dir(processedTracks);
// }

// const killMetadataErrors = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const errorTracks = db.tracks.filter((t: Track) => t.metadataError);
//   console.dir(errorTracks, { depth: null });
//   console.log(`Remove ${errorTracks.length} tracks?`)
//   prompt.start();
//   prompt.get(['confirm'], async (err, result) => {
//     if (result.confirm === 'y') {
//       const deletion = errorTracks.map((t: Track) => t.id);
//       await dbClient.delete('tracks', deletion);
//       console.log('Deleted');
//     }
//   });
// }

// const clearTimeoutErrors = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const timeoutErrorTracks = await findTimeoutErrorTracks(db.tracks);
//   const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
//   await dbClient.update('tracks', updates);
// }

// const clearIPFSProtocolErrors = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const timeoutErrorTracks = await findIPFSProtocolErrorTracks(db.tracks);
//   const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
//   await dbClient.update('tracks', updates);
// }

// const clearECONNREFUSEDErrors = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const timeoutErrorTracks = await findECONNREFUSEDErrorTracks(db.tracks);
//   const updates = timeoutErrorTracks.map(t => ({ id: t.id, metadataError: undefined }));
//   await dbClient.update('tracks', updates);
// }

// const resetProcessTracks = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const tracks = db.tracks;
//   const updates = tracks.map((track: Track) => ({ id: track.id, processed: undefined, processError: undefined }));
//   await dbClient.update('tracks', updates);
// }

// const resetProcessErrorTracks = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const processErrorTracks = await findTracks(db.tracks, { processed: true, processError: true });
//   const updates = processErrorTracks.map(t => ({ id: t.id, processed: undefined, processError: undefined }));
//   await dbClient.update('tracks', updates);
// }

// const resetNOIZDProcessErrorTracks = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const processErrorTracks = await findTracks(db.tracks, { processed: true, processError: true, platformId: MusicPlatform.noizd });
//   const updates = processErrorTracks.map(t => ({ id: t.id, processed: undefined, processError: undefined }));
//   await dbClient.update('tracks', updates);
// }

// const printProcessedTrackCount = async (filter: any) => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const processedCatalogTracks = await findTracks(db.tracks, filter);
//   console.log({ processedCatalogTracks: processedCatalogTracks.length });
// }

// const killResetProcessedTracks = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   const processedTracks = db.processedTracks;
//   console.log(`Remove ${processedTracks.length} tracks?`)
//   prompt.start();
//   prompt.get(['confirm'], async (err, result) => {
//     if (result.confirm === 'y') {
//       const deletion = processedTracks.map((t: ProcessedTrack) => t.id);
//       await dbClient.delete('processedTracks', deletion);
//       await resetProcessTracks();
//       console.log('Deleted');
//     }
//   });
// }

// const killNOIZDCursor = async () => {
//   const dbClient = await dbLib.init();
//   const { db, indexes } = await dbClient.getFullDB();
//   console.log(`Remove noizd cursor?`)
//   prompt.start();
//   prompt.get(['confirm'], async (err, result) => {
//     if (result.confirm === 'y') {
//       const cursorName = `createProcessedTracksFromAPI_noizd`
//       const initialCursor = platformConfig.noizd.initialTrackCursor!;
//       await dbClient.updateProcessor(cursorName, initialCursor);
//       console.log('Deleted');
//     }
//   });
// }

function pad100(number: number) {
  const s = '00' + number;
  return s.substring(s.length - 3);
}

const PLAYLIST_API = 'https://us-central1-spinamp-prod.cloudfunctions.net/playlist/';
const IPFS_GATEWAY_URL = 'https://snowfork.mo.cloudinary.net/';
const OUTPUT_DIR = `export/`
const exportPlaylist = async(clients: Clients, id: string) => {
  const ax = await axios.init();
  const response = await ax.get(`${PLAYLIST_API}${id}`);
  const trackIDs = response.data.trackIds;
  const tracks = await getSpecificTracks(clients, trackIDs)
  let count = 0;
  console.log(`Downloading ${tracks.length} tracks`)
  tracks.map((track, index) => {

    const trackAudioUrl =
    track.lossyAudioIpfsHash && track.lossyAudioIpfsHash !== ''
      ? `${IPFS_GATEWAY_URL}${track.lossyAudioIpfsHash}?resource_type=video`
      : track.lossyAudioUrl;

    const trackFileName = `${pad100(index)}_${track.title.split(' ').join('_')}_${track.artist.split(' ').join('_')}`.replace('/','_');
    console.log(`Downloading ${trackFileName} from ${trackAudioUrl}`);
    const file = fs.createWriteStream(`${OUTPUT_DIR}${trackFileName}.mp3`);
    https.get(trackAudioUrl, (trackResponse) => {
      trackResponse.pipe(file);
      file.on('finish', () => {
        file.close();
        count++;
        console.log(`Downloaded ${count} of ${tracks.length}`);
      });
    });
  });
}

const downloadSaveTrack = (track: any, index: number) => {
  const trackAudioUrl =
track.lossyAudioIpfsHash && track.lossyAudioIpfsHash !== ''
  ? `${IPFS_GATEWAY_URL}${track.lossyAudioIpfsHash}`
  : track.lossyAudioUrl;

  const trackFileName = `${index}_${track.title.split(' ').join('_')}_${track.artist.split(' ').join('_')}`.replace('/','_');
  console.log(`Downloading ${trackFileName} from ${trackAudioUrl}`);
  const file = fs.createWriteStream(`${OUTPUT_DIR}${trackFileName}.mp3`);
  return new Promise(function(resolve, reject) {
    https.get(trackAudioUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Download of ${trackAudioUrl} Completed`);
        resolve(undefined);
      });
    });
  });
}

const primeAudioCache = async (clients: Clients) => {
  const cids = await getTrackAudioCIDs(clients.db);
  console.log(`Priming ${cids.length} cids`);
  const primeCID = async (cid: string, count?: number) => {
    console.log(`Priming CID ${count}: ${cid}`);
    const url = `${process.env.CLOUDINARY_API_ENDPOINT}?url=${process.env.CLOUDINARY_CACHE_ENDPOINT}/${cid}?resource_type=video`;
    return clients.axios.post(url, {}, {
      auth: {
        username: process.env.CLOUDINARY_USERNAME!,
        password: process.env.CLOUDINARY_PASSWORD!
      }
    });
  };
  await rollPromises(cids, primeCID);
  console.log('Completed.')
}

const getSpecificTracks = async (clients: Clients, trackIDs: string[]) => {
  const idQuery = (trackIDs || []).map(id => `"${id}"`).toString();
  const q = gql`query MyQuery {
    allProcessedTracks(filter: {id: {in: [${idQuery}]}}) {
      totalCount
      edges {
        node {
          id
          title
          lossyAudioIpfsHash
          lossyAudioUrl
          artistId
          artistByArtistId {
            name
          }
        }
      }
    }
  }
  `

  const URL = 'https://api.spinamp.xyz/graphql';
  const response = await request(URL, q);
  const tracks = response.allProcessedTracks.edges.map((e: any) => ({
    id: e.node.id,
    title: e.node.title,
    lossyAudioIpfsHash: e.node.lossyAudioIpfsHash,
    lossyAudioUrl: e.node.lossyAudioUrl,
    artist: e.node.artistByArtistId.name,
  }))
  const sortedTracks = _.sortBy(tracks, track => trackIDs.indexOf(track.id));
  return sortedTracks;
}

export const getTrackAudioCIDs = async (dbClient: DBClient, limit?: number) => {
  const sql = `select "lossyAudioIPFSHash" from "${Table.processedTracks}"`;
  const cids = (await dbClient.rawSQL(sql)).rows.map((r: any) => r.lossyAudioIPFSHash);
  return cids.filter((c: string | undefined | null) => !!c);
};

const start = async () => {
  const clients = await initClients();
  // .command('printMissingIPFS', 'print all tracks with missing ipfs hashes', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printMissingIPFS();
  // })
  // .command('printMissingMetadata', 'print all tracks with missing metadata', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printMissingMetadata();
  // })
  // .command('printMetadataErrors', 'print all tracks with metadata errors', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printMetadataErrors();
  // })
  // .command('clearFixedMetadataErrors', 'clear out metadata errors from tracks that have has metadata successfully added', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await clearFixedMetadataErrors();
  // })
  // .command('clearTimeoutErrors', 'clear out metadata errors from tracks with timeout errors', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await clearTimeoutErrors();
  // })
  // .command('clearIPFSProtocolErrors', 'clear out metadata errors from tracks with ipfs protocol url errors', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await clearIPFSProtocolErrors();
  // })
  // .command('clearECONNREFUSEDErrors', 'clear out metadata errors from tracks with ECONNREFUSED errors', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await clearECONNREFUSEDErrors();
  // })
  // .command('clearStaleErrors', 'clear out metadata errors that are stale and should be retried from tracks', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await clearFixedMetadataErrors();
  //   await clearTimeoutErrors();
  //   await clearIPFSProtocolErrors();
  //   await clearECONNREFUSEDErrors();
  // })
  // .command('killMetadataErrors', 'clear out tracks that have a metadataError', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await killMetadataErrors();
  // })
  // .command('killResetProcessedTracks', 'clear out and reset all processed tracks', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await killResetProcessedTracks();
  // })
  // .command('killNOIZDCursor', 'clear out noizd api track cursos', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await killNOIZDCursor();
  // })
  // .command('printMimeTypes', 'print all mime types in metadata in db', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printMimeTypes();
  // })
  // .command('printSoundTracks', 'print all sound tracks', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printSoundTracks();
  // })
  // .command('printZoraNotCatalogTracks', 'print all zora tracks that are not from catalog preprocessing', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printZoraNotCatalogTracks();
  // })
  // .command('printFakeCatalogTracks', 'print all zora tracks that are not from catalog', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printFakeCatalogTracks();
  // })
  // .command('printZoraTracks', 'print all raw zora tracks that are not from catalog postprocessing', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printTracks('platformId', 'zoraRaw');
  // })
  // .command('printCatalogTracks', 'print all catalog-only zora tracks', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printTracks('platformId', 'catalog');
  // })
  // .command('printUnprocessedZoraTracks', 'print all unprocessed zora tracks', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printTracks('platformId', 'zora');
  // })
  // .command('printNoArtist', 'print tracks with no artist', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printTracks('artist', undefined);
  // })
  // .command('printNoizdTracks', 'print noizd tracks', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printProcessedTracks('platformId', MusicPlatform.noizd);
  // })
  // .command('printNOIZDDuplicates', 'print noizd duplicates', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printNOIZDDuplicates('platformId', MusicPlatform.noizd);
  // })
  // .command('resetProcessErrorTracks', 'clear out processing and processError from tracks with error so they can be retried', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await resetProcessErrorTracks();
  // })
  // .command('printProcessedCatalogTrackCount', 'print processed catalog track count', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printProcessedTrackCount({ platformId: MusicPlatform.catalog, processed: true });
  // })
  // .command('printProcessErrorCatalogTrackCount', 'print failed processing catalog track count', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printProcessedTrackCount({ platformId: MusicPlatform.catalog, processError: true });
  // })
  // .command('printProcessErrorTrackCount', 'print failed processing track count', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printProcessedTrackCount({ processError: true });
  // })
  // .command('printProcessErrorTracks', 'print failed processing tracks count', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await printTracks('processError', true);
  // })
  // .command('resetNOIZDProcessErrorTracks', 'clear out processing and processError from NOIZD tracks with error so they can be retried', async (yargs) => {
  //   return yargs
  // }, async () => {
  //   await resetNOIZDProcessErrorTracks();
  // })
  yargs(hideBin(process.argv))
    .command('prime-audio-cache', 'prime the audio file cdn cache', async (yargs) => {
      return yargs
    }, async () => {
      await primeAudioCache(clients);
    })
    .command('export-playlist', 'export a playlist', async (yargs) => {
      return yargs.argv
    }, async ({ id }) => {
      await exportPlaylist(clients, id as string);
    })
    .parse()
}

start();
