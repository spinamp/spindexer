import { trackMetadataEmpty } from '../triggers/empty';
import { Clients, Processor } from '../types/processor';
import { Track } from '../types/tracks';

const processorFunction = async (tracks: Track[], clients: Clients) => {
  // todo: do metadata url calls to get all metadata and add to track record
  // todo: postfilter/zora only music&catalog filter/extra noizd calls/extra centralized calls for optimized media
};

export const addTrackMetadata: Processor = {
  name: 'addTrackMetadata',
  trigger: trackMetadataEmpty,
  processorFunction,
};
