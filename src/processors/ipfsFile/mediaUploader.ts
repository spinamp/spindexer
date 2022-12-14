import { urlSource } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { IPFSFile, IPFSFileUrl } from '../../types/ipfsFile';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { Trigger } from '../../types/trigger';
import { rollPromises } from '../../utils/rollingPromises';

type TrackUrlJoin = ProcessedTrack & Partial<IPFSFileUrl>;
type MediaType = 'Artwork' | 'Audio';

const notOnIpfs: (media: MediaType) => Trigger<undefined> =
(media) => async (clients: Clients) => {
  const query = `select "id", "lossy${media}URL", "lossy${media}IPFSHash", fileUrl."url", fileUrl."cid" from "${Table.processedTracks}"
      left outer join "${Table.ipfsFilesUrls}" as fileUrl
      on "lossy${media}URL" = fileUrl.url
      where "lossy${media}IPFSHash" is null
      and "lossy${media}URL" is not null
      and fileUrl.error is null
      LIMIT ${process.env.IPFS_UPLOAD_BATCH_SIZE || process.env.QUERY_TRIGGER_BATCH_SIZE!}`

  const trackUrlJoin = (await clients.db.rawSQL(
    query
  )).rows

  return trackUrlJoin
};

function processorFunction(media: MediaType) {
  return async (tracksWithIPFSFiles: TrackUrlJoin[], clients: Clients) => {
    const trackUpdates: Partial<ProcessedTrack>[] = [];
    const ipfsFiles: IPFSFile[] = [];
    const ipfsFilesUrls: IPFSFileUrl[] = [];

    const urlField = `lossy${media}URL`
    const ipfsField = `lossy${media}IPFSHash`

    const processTrack = async (trackWithUrl: TrackUrlJoin) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const url = trackWithUrl[urlField]
      const source = urlSource(url)
      let cid = trackWithUrl['cid']

      const track: Partial<ProcessedTrack> = {
        id: trackWithUrl.id,
        [ipfsField]: cid,
        [urlField]: url
      }

      try {
        if (!cid){
          const file = await clients.ipfs.client.add(source, {
            pin: false,
            timeout: parseInt(process.env.IPFS_API_TIMEOUT!)
          });
          cid = file.cid.toString();
        }

        trackUpdates.push({
          ...track,
          [ipfsField]: cid
        })
        ipfsFiles.push({
          cid: cid
        })
        ipfsFilesUrls.push({
          url: url,
          cid: cid
        })
      } catch (e: any){
        console.log({ url, error: e.message });
        ipfsFilesUrls.push({ url, error: e.message });
      }
    }
    await rollPromises<ProcessedTrack, void, void>(tracksWithIPFSFiles, processTrack, 300, 10000)

    await clients.db.update(Table.processedTracks, trackUpdates)
    await clients.db.upsert(Table.ipfsFiles, ipfsFiles, 'cid');
    await clients.db.upsert(Table.ipfsFilesUrls, ipfsFilesUrls, 'url');
  }
}

export const ipfsMediaUploader: (media: MediaType) => Processor =
(media) => {
  return {
    name: `ipfs${media}Uploader`,
    trigger: notOnIpfs(media),
    processorFunction: processorFunction(media),
    initialCursor: undefined
  }
}
