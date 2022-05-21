import { Axios, AxiosResponse, AxiosError } from 'axios';

import { Table } from '../../db/db';
import { processedTracksWithoutPins } from '../../triggers/ipfs';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { RollOutput, rollPromises } from '../../utils/rollingPromises';

const name = 'ipfsPinner';

const ipfsPinEndpoint = `${process.env.IPFS_PIN_URL}`;
const pinAuth = {
  headers: { Authorization: `Bearer ${process.env.IPFS_PIN_JWT}` }
};
const maxPPM = parseInt(process.env.IPFS_PIN_MAX_PROMISES_PER_MINUTE!);

const pinTrack = (timeout: number, axios: Axios) => (track: ProcessedTrack): Promise<any> => {
  const catchFunc = (error: any) => {
    if (error.response.status === 400) {
      if (error?.response?.data?.error?.reason === 'DUPLICATE_OBJECT') {
        return true;
      }
    }
    return false;
  };
  const audioPromise = track.lossyAudioIPFSHash ?
    axios.post(ipfsPinEndpoint, { cid: track.lossyAudioIPFSHash }, { timeout, ...pinAuth }).catch(catchFunc) : Promise.resolve(null);
  const artworkPromise = track.lossyArtworkIPFSHash ?
    axios.post(ipfsPinEndpoint, { cid: track.lossyArtworkIPFSHash }, { timeout, ...pinAuth }).catch(catchFunc) : Promise.resolve(null);

  return Promise.allSettled([audioPromise, artworkPromise]).then(([audioPinCompleted, artPinCompleted]) => {
    console.log({ audioPinCompleted, artPinCompleted });
    console.log({ audioPinCompleteddeets: (audioPinCompleted as any).value?.data });
    return {
      audioPinCompleted: {
        requestId: (audioPinCompleted as any).value.data.requestid,
        status: (audioPinCompleted as any).value.data.status,
      },
      artPinCompleted: {
        requestId: (artPinCompleted as any).value.data.requestid,
        status: (artPinCompleted as any).value.data.status,
      }
    };
  });
}

const processorFunction = async (processedTracks: ProcessedTrack[], clients: Clients) => {
  console.log(`Processing updates for ${processedTracks.map(t => t.id)}`);

  const pinResponse = pinTrack(parseInt(process.env.IPFS_PIN_REQUEST_TIMEOUT!), clients.axios);

  const results = await rollPromises<ProcessedTrack, { audioPinCompleted: boolean, artPinCompleted: boolean }, any>(
    processedTracks,
    pinResponse,
    undefined,
    maxPPM,
  );
  const trackPins: {
    processedTrackId: string
    audioPinned: boolean
    artworkPinned: boolean
  }[] = [];
  const pins: {
    id: string
    requestId: string
    status: string
  }[] = [];
  processedTracks.forEach((track, index) => {
    const audioPinCompleted = results[index].response!.audioPinCompleted
    const artPinCompleted = results[index].response!.artPinCompleted
    if (audioPinCompleted !== false && artPinCompleted !== false) {
      trackPins.push({
        processedTrackId: track.id,
        audioPinned: true,
        artworkPinned: true,
      });
      if (audioPinCompleted.requestId) {
        pins.push({
          id: audioPinCompleted.cid,
          requestId: audioPinCompleted.requestId,
          status: audioPinCompleted.status,
        });
      }
      if (artPinCompleted.requestId) {
        pins.push({
          id: artPinCompleted.cid,
          requestId: artPinCompleted.requestId,
          status: artPinCompleted.status,
        });
      }
    } else {
      throw new Error(`Error pinning track: ${track.id}`);
    }
  });
  if (trackPins.length !== processedTracks.length) {
    throw new Error('Not all tracks pinned');
  }
  await clients.db.insert(Table.processedTracks_ipfsPins, trackPins);
};

export const ipfsPinner: Processor = ({
  name,
  trigger: processedTracksWithoutPins(5),
  processorFunction: processorFunction,
  initialCursor: undefined
});
