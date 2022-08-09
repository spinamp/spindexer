
import { urlSource } from 'ipfs-http-client';
import _ from 'lodash'

import { Table } from '../../db/db';
import { artworkNotOnIpfs, audioNotOnIpfs } from '../../triggers/ipfs';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';

function processorFunction(sourceField: 'lossyAudioURL' | 'lossyArtworkURL', replaceField: 'lossyAudioIPFSHash' | 'lossyArtworkIPFSHash') {
  return async (newTriggerItems: any, clients: Clients) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const tracksByFilePath = _.keyBy(newTriggerItems, (track: ProcessedTrack) => new URL(track[sourceField]).pathname.split('/').pop());
      
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const sources = newTriggerItems.map((track: ProcessedTrack) => {return urlSource(track[sourceField]!)} );
    const allFiles = await clients.ipfs.client.addAll(sources, {
      progress: (bytes, path) => console.log(`added ${bytes} bytes of ${path}`),
      fileImportConcurrency: 10,
    });
    
    const updatedTracks: ProcessedTrack[] = [];
    
    for await (const file of allFiles){
      const track = tracksByFilePath[file.path];
    
      updatedTracks.push({
        ...track,
        [replaceField]: file.cid.toString()
      });
    }
    
    await clients.db.update(Table.processedTracks, updatedTracks)
  }
} 

export const ipfsAudioUploader: Processor = ({
  name: 'ipfsAudioUploader',
  trigger: audioNotOnIpfs,
  processorFunction: processorFunction('lossyAudioURL', 'lossyAudioIPFSHash'),
  initialCursor: undefined
});

export const ipfsArtworkUploader: Processor = ({
  name: 'ipfsArtworkUploader',
  trigger: artworkNotOnIpfs,
  processorFunction: processorFunction('lossyArtworkURL', 'lossyArtworkIPFSHash'),
  initialCursor: undefined
});