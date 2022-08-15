
import { urlSource } from 'ipfs-http-client';
import _ from 'lodash';


import { Table } from '../../db/db';
import { artworkNotOnIpfs, audioNotOnIpfs } from '../../triggers/ipfs';
import { IPFSFile } from '../../types/ipfsFIle';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { rollPromises } from '../../utils/rollingPromises';

function processorFunction(sourceField: 'lossyAudioURL' | 'lossyArtworkURL', replaceField: 'lossyAudioIPFSHash' | 'lossyArtworkIPFSHash') {
  return async (tracks: ProcessedTrack[], clients: Clients) => {
    const updates: ProcessedTrack[] = [];
    const ipfsFiles: IPFSFile[] = [];

    const existingFiles = await clients.db.getRecords<IPFSFile>(Table.ipfsFiles, [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ['whereIn', ['url', tracks.map(track => track[sourceField])]]
    ]);
    const fileByUrl = _.keyBy(existingFiles, 'url')
    
    const processTrack = async (track: ProcessedTrack) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const url = track[sourceField];
      try {
        
        const fileForUrl = fileByUrl[url];
        
        if (!fileForUrl){
          const source = urlSource(url)
          const file = await clients.ipfs.client.add(source, {
            pin: false,
            timeout: parseInt(process.env.IPFS_API_TIMEOUT!)
          });
          const cid = file.cid.toString();
          updates.push({
            ...track,
            [replaceField]: cid
          })
          ipfsFiles.push({
            url,
            cid
          })
        } else {
          updates.push({
            ...track,
            [replaceField]: fileForUrl.cid
          })
        }
      } catch (e: any){
        ipfsFiles.push({ url, error: e.message });
      }
    }
    
    await rollPromises<ProcessedTrack, void, void>(tracks, processTrack, 300, 50)

    await clients.db.update(Table.processedTracks, updates)
    await clients.db.upsert(Table.ipfsFiles, ipfsFiles, 'url');
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