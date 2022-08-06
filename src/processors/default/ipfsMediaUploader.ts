import { urlSource } from 'ipfs-http-client';
import _ from 'lodash';

import { Table } from '../../db/db';
import { audioNotOnIpfs } from '../../triggers/ipfs';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';

async function processorFunction(newTriggerItems: any, clients: Clients){
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const tracksByLossyAudioPath = _.keyBy(newTriggerItems, (track: ProcessedTrack) => new URL(track.lossyAudioURL).pathname.split('/').pop());
  
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const sources = newTriggerItems.map((track: ProcessedTrack) => {return urlSource(track.lossyAudioURL!)} );
  const allFiles = await clients.ipfs.client.addAll(sources, {
    progress: (bytes, path) => console.log(`added ${bytes} bytes of ${path}`),
    fileImportConcurrency: 30,
  });

  const updatedTracks: ProcessedTrack[] = [];

  for await (const file of allFiles){
    const track = tracksByLossyAudioPath[file.path];

    updatedTracks.push({
      ...track,
      lossyAudioIPFSHash: file.cid.toString()
    });
  }

  await clients.db.update(Table.processedTracks, updatedTracks)
}

export const ipfsAudioUploader: Processor = ({
  name: 'ipfsAudioUploader',
  trigger: audioNotOnIpfs,
  processorFunction: processorFunction,
  initialCursor: undefined
});