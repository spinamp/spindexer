import { AxiosResponse } from 'axios';
import _ from 'lodash';
import { extractBaseCIDFromHash } from '../../clients/ipfs';

import { Table } from '../../db/db';
import { unpinnedTrackContent } from '../../triggers/ipfs';
import { Clients, Processor } from '../../types/processor';
import { rollPromises } from '../../utils/rollingPromises';

const name = 'ipfsPinner';

const ipfsPinEndpoint = `${process.env.IPFS_PIN_URL}`;
const pinAuth = {
  headers: { Authorization: `Bearer ${process.env.IPFS_PIN_JWT}` }
};
const maxPPM = parseInt(process.env.IPFS_PIN_MAX_PROMISES_PER_MINUTE!);

const processorFunction = async (cids: string[], clients: Clients) => {
  console.log(`Pinning ${cids}`);

  const baseCIDLookups = _.groupBy(cids, cid => extractBaseCIDFromHash(cid));
  const baseCIDs = Object.keys(baseCIDLookups);

  const existingResponse = await clients.axios.get(
    `${ipfsPinEndpoint}?cid=${baseCIDs}`,
    { timeout: parseInt(process.env.IPFS_PIN_REQUEST_TIMEOUT!), ...pinAuth });

  if (!existingResponse.data.results) {
    console.log(existingResponse.data?.error);
    throw new Error('Error querying pins');
  }

  const existingPinResponses: [] = existingResponse.data.results;
  const existingBaseCids = existingPinResponses.map((p: any) => p.pin.cid);
  const newPins = baseCIDs.filter(cid => !existingBaseCids.includes(cid));

  const pinsToInsert = existingPinResponses.reduce((accum:any, pinResponse: any) => {
    const baseCID = pinResponse.pin.cid;
    const existingCIDs = baseCIDLookups[baseCID];
    existingCIDs.forEach(cid => {
      accum.push({
        id: cid,
        requestId: pinResponse.requestid,
        status: pinResponse.status,
      });
    })
    return accum;
  }, [] as any);

  if (newPins.length !== 0) {
    const pinBaseCID = (baseCid: string) => clients.axios.post(
      ipfsPinEndpoint, { cid: baseCid },
      { timeout: parseInt(process.env.IPFS_PIN_REQUEST_TIMEOUT!), ...pinAuth });

    const responses = await rollPromises<string, AxiosResponse, any>(
      newPins,
      pinBaseCID,
      undefined,
      maxPPM,
    );


    responses.forEach(response => {
      if (response.isError) {
        throw new Error(`Error pinning base cid: ${response.error}`);
      }

      const baseCID = response.response!.data.pin.cid;
      const existingCIDs = baseCIDLookups[baseCID];
      existingCIDs.forEach(cid => {
        pinsToInsert.push({
          id: cid,
          requestId: response.response!.data.requestid,
          status: response.response!.data.status,
        });
      })
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
