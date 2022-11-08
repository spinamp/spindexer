import { urlSource } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { artworkNotOnIpfs, audioNotOnIpfs } from '../../triggers/ipfs';
import { IPFSFile } from '../../types/ipfsFIle';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { rollPromises } from '../../utils/rollingPromises';

type TrackFileJoin = ProcessedTrack & Partial<IPFSFile>;

function processorFunction(sourceField: 'lossyAudioURL' | 'lossyArtworkURL', replaceField: 'lossyAudioIPFSHash' | 'lossyArtworkIPFSHash') {
  return async (tracksWithIPFSFiles: TrackFileJoin[], clients: Clients) => {
    const updates: Partial<ProcessedTrack>[] = [];
    const ipfsFiles: IPFSFile[] = [];

    const processTrack = async (trackWithFile: TrackFileJoin) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const url = trackWithFile[sourceField];
      try {

        const fileForUrl: Partial<IPFSFile> = {
          cid: trackWithFile.cid,
          url: trackWithFile.url
        }

        delete trackWithFile['url']
        delete trackWithFile['error'];
        delete trackWithFile['cid'];

        const track: ProcessedTrack = {
          ...trackWithFile
        }

        if (!fileForUrl.cid){
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
        console.log({ url, error: e.message });
        ipfsFiles.push({ url, error: e.message });
      }
    }

    await rollPromises<ProcessedTrack, void, void>(tracksWithIPFSFiles, processTrack, 300, 10000)

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

// export const ipfsArtworkResetter: Processor = ({
//   name: 'ipfsArtworkResetter',
//   trigger: artworkChanged,
//   processorFunction: async (tracks: ProcessedTrack[], clients: Clients) => {
//     const updates = tracks.map(track => ({
//       ...track,
//       lossyArtworkIPFSHash: null
//     }))
//     await clients.db.update(Table.processedTracks, updates)
//   },
//   initialCursor: undefined
// });
