import { AxiosResponse } from 'axios';
import _ from 'lodash';

import { extractBaseCIDFromHash } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { Trigger } from '../../types/trigger';
import { rollPromises } from '../../utils/rollingPromises';

const ipfsPinEndpoint = `${process.env.IPFS_PIN_URL}`;
const pinAuth = {
  headers: { Authorization: `Bearer ${process.env.IPFS_PIN_JWT}` }
};
const maxPPM = parseInt(process.env.IPFS_PIN_MAX_PROMISES_PER_MINUTE!);

const IPFS_ORIGINS = process.env.IPFS_NODE_MULTIADDRESS?.split(',');

const unpinnedTrackContent: (cidField: string, limit?: number) => Trigger<undefined> =
  (cidField: string, limit: number = parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)) => async (clients: Clients) => {
    const query = `select t.* from "${Table.processedTracks}" as t
      LEFT OUTER JOIN "${Table.ipfsPins}" as p
      ON t."${cidField}" = p.id
      WHERE (t."${cidField}" IS NOT NULL)
      AND (t."${cidField}" <> '')
      AND (p.id is NULL)
      LIMIT ${limit}`

    const tracks = (await clients.db.rawSQL(
      query
    )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));

    const cids = tracks.map((track: ProcessedTrack) => {
      if (!(track as any)[cidField]) {
        throw new Error('Unexpected null ipfs cid')
      }
      return (track as any)[cidField];
    });

    return _.uniq(cids);
  };

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

  const pinsToInsert = existingPinResponses.reduce((accum: any, pinResponse: any) => {
    const baseCID = pinResponse.pin.cid;
    const existingCIDs = baseCIDLookups[baseCID];
    existingCIDs.forEach(cid => {
      accum.push({
        id: cid,
        requestId: pinResponse.requestid,
      });
    })
    return accum;
  }, [] as any);

  if (newPins.length !== 0) {
    const pinBaseCID = (baseCid: string) => clients.axios.post(
      ipfsPinEndpoint, { cid: baseCid,
        origins: IPFS_ORIGINS
      },
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
  name: 'ipfsAudioPinner',
  trigger: unpinnedTrackContent('lossyAudioIPFSHash', 10), // 10 is the max on many pinning apis for querying if already pinned
  processorFunction: processorFunction,
  initialCursor: undefined
});

export const ipfsArtworkPinner: Processor = ({
  name: 'ipfsArtworkPinner',
  trigger: unpinnedTrackContent('lossyArtworkIPFSHash', 10), // 10 is the max on many pinning apis for querying if already pinned
  processorFunction: processorFunction,
  initialCursor: undefined
});
