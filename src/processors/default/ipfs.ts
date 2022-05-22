import { Axios, AxiosResponse, AxiosError } from 'axios';
import _ from 'lodash';

import { Table } from '../../db/db';
import { unpinnedTrackContent } from '../../triggers/ipfs';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { RollOutput, rollPromises } from '../../utils/rollingPromises';

const name = 'ipfsPinner';

const ipfsPinEndpoint = `${process.env.IPFS_PIN_URL}`;
const pinAuth = {
  headers: { Authorization: `Bearer ${process.env.IPFS_PIN_JWT}` }
};
const maxPPM = parseInt(process.env.IPFS_PIN_MAX_PROMISES_PER_MINUTE!);

const processorFunction = async (cids: string[], clients: Clients) => {
  console.log(`Pinning ${cids}`);

  cids = _.uniq(cids);

  const existingResponse = await clients.axios.get(
    `${ipfsPinEndpoint}?cid=${cids}`,
    { timeout: parseInt(process.env.IPFS_PIN_REQUEST_TIMEOUT!), ...pinAuth });

  if (!existingResponse.data.results) {
    console.log(existingResponse.data?.error);
    throw new Error('Error querying pins');
  }

  const existingPins: [] = existingResponse.data.results;
  const existingCids = existingPins.map((p: any) => p.pin.cid);
  const newPins = cids.filter(cid => !existingCids.includes(cid));

  const pinsToInsert = existingPins.map((p: any) => ({
    id: p.pin.cid,
    requestId: p.requestid,
    status: p.status,
  }))

  if (newPins.length !== 0) {
    const pinCID = (cid: string) => clients.axios.post(
      ipfsPinEndpoint, { cid },
      { timeout: parseInt(process.env.IPFS_PIN_REQUEST_TIMEOUT!), ...pinAuth });

    const responses = await rollPromises<string, AxiosResponse, any>(
      newPins,
      pinCID,
      undefined,
      maxPPM,
    );


    responses.forEach(response => {
      if (response.isError) {
        throw new Error(`Error pinning cid: ${response.error}`);
      }

      pinsToInsert.push({
        id: response.response!.data.pin.cid,
        requestId: response.response!.data.requestid,
        status: response.response!.data.status,
      });
    });

  }

  if (pinsToInsert.length !== cids.length) {
    throw new Error('Not all tracks pinned');
  }

  await clients.db.insert(Table.ipfsPins, pinsToInsert);
};

export const ipfsAudioPinner: Processor = ({
  name,
  trigger: unpinnedTrackContent('lossyAudioIPFSHash', 10), // 10 is the max on many pinning apis
  processorFunction: processorFunction,
  initialCursor: undefined
});

export const ipfsArtworkPinner: Processor = ({
  name,
  trigger: unpinnedTrackContent('lossyArtworkIPFSHash', 10), // 10 is the max on many pinning apis
  processorFunction: processorFunction,
  initialCursor: undefined
});
