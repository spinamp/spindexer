
import { Table } from '../../db/db';
import { IPFSFile } from '../../types/ipfsFile';
import { MimeEnum } from '../../types/media';
import { Clients, Processor } from '../../types/processor';
import { Trigger } from '../../types/trigger';
import { rollPromises } from '../../utils/rollingPromises';

const TIMEOUT = parseInt(process.env.METADATA_REQUEST_TIMEOUT!)
const QUERY_LIMIT = process.env.IPFS_METADATA_REQUEST_BATCH_SIZE || process.env.QUERY_TRIGGER_BATCH_SIZE

const missingMimeType: Trigger<undefined> = async (clients) => {
  const query = `select * from "${Table.ipfsFiles}"
      where "cid" is not null
      and "mimeType" is null
      and "error" is null
      LIMIT ${QUERY_LIMIT}`

  const ipfsFiles = (await clients.db.rawSQL(query)).rows;
  return ipfsFiles;
}

export const ipfsMimeTypeProcessor: Processor =
  {
    name: `ipfsMimeTypeProcessor`,
    trigger: missingMimeType,
    processorFunction: async (input: IPFSFile[], clients: Clients) => {
      console.log(`Fetching ipfsFiles mime types`);

      const updateMimeTypes = async (ipfsFile: IPFSFile) => {
        const ipfsHash = ipfsFile.cid;
        let response: any;
        let errorMsg: string | undefined = undefined;
        let contentType: any = '';

        try {
          response = await clients.axios.head(`${process.env.IPFS_ENDPOINT}${ipfsHash}`, { timeout: TIMEOUT })
          contentType = response.headers['content-type']?.toLowerCase();
        } catch (e: any) {
          errorMsg = `Error: failed to fetch mime type for ipfs hash: ${ipfsHash} with error: ${e.message}`;
        }

        // todo: enrich with isAudio, isVideo, isImage flags
        if (contentType && !Object.values(MimeEnum).includes(contentType)) {
          errorMsg = `Error: unsupported mime type '${contentType}' for ipfs hash: ${ipfsHash}`;
        }

        const result = ipfsFile;

        if (errorMsg) {
          result.error = errorMsg;
        } else {
          result.mimeType = contentType;
        }

        return result;
      }

      const results = await rollPromises<IPFSFile, any, void>(
        input,
        updateMimeTypes,
      );

      const updates = results.map(result => result.response);

      if (updates.length > 0) {
        await clients.db.update(Table.ipfsFiles, updates, 'url');
      }
    },
    initialCursor: undefined
  }
