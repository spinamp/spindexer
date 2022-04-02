import 'dotenv/config';
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

const updateTracksMetadataFix = async (dbClient: DBClient) => {
  const { db, indexes } = await dbClient.getFullDB();
  const metadataFixedTracks = findMetadataDups(db.tracks);
  const updates = metadataFixedTracks.map(t => ({ id: t.id, metadataError: undefined }));
  dbClient.update('tracks', updates);
}
const start = async () => {
  const dbClient = await dbLib.init();
};

start();
