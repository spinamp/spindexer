
import { Table } from '../../db/db';
import { IPFSFile } from '../../types/ipfsFile';
import { updateMimeTypes } from '../../types/media';
import { Clients, Processor } from '../../types/processor';
import { Trigger } from '../../types/trigger';
import { rollPromises } from '../../utils/rollingPromises';

const TIMEOUT = parseInt(process.env.METADATA_REQUEST_TIMEOUT!)
const QUERY_LIMIT = process.env.IPFS_METADATA_REQUEST_BATCH_SIZE || process.env.QUERY_TRIGGER_BATCH_SIZE

const missingMimeType: Trigger<undefined> = async (clients) => {
  const query = `select f.* from "${Table.ipfsFiles}" as f
      join "${Table.ipfsPins}" as p on f."cid" = p."id"
      where f."cid" is not null
      and f."mimeType" is null
      and f."error" is null
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
