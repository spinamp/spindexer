import { missingTrackMetadata } from '../triggers/empty';
import { Clients, Processor } from '../types/processor';
import { Track } from '../types/tracks';

// todo: do metadata url calls to get all metadata and add to track record
// todo: postfilter/zora only music&catalog filter/extra noizd calls/extra centralized calls for optimized media

const name = 'addTrackMetadata';

const processorFunction = async (tracks: Track[], clients: Clients) => {
  // todo: query metadata in parallel
  // ...

  // todo: should upsert
  // await clients.db.insert('tracks', newTracks);
};

export const addTrackMetadataProcessor: Processor = {
  name,
  trigger: missingTrackMetadata,
  processorFunction,
};
