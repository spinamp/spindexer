import { Table } from '../../db/db';
import { IPFSFile, IPFSFileUrl } from '../../types/ipfsFile';
import { Clients, Processor } from '../../types/processor';
import { Trigger } from '../../types/trigger';

const NUMBER_OF_RETRIES = parseInt(process.env.NUMBER_OF_ERROR_RETRIES!);

const ipfsFilesWithErrors: Trigger<undefined> = async (clients) => {
  const query = `select * from "${Table.ipfsFiles}"
      where "error" is not null
      and ("mimeType" is null)
      and ("numberOfRetries" < '${NUMBER_OF_RETRIES}' or "numberOfRetries" is null)
      and (age(now(), "lastRetry") >= make_interval(mins => cast(pow(coalesce("numberOfRetries", 0), 3) as int)) or "lastRetry" is null)
      LIMIT ${process.env.QUERY_TRIGGER_BATCH_SIZE}`;

  const ipfsFiles = (await clients.db.rawSQL(query))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));

  return ipfsFiles;
}

const ipfsFilesUrlsWithErrors: Trigger<undefined> = async (clients) => {
  const query = `select * from "${Table.ipfsFilesUrls}"
      where "error" is not null
      and ("cid" is null)
      and ("numberOfRetries" < '${NUMBER_OF_RETRIES}' or "numberOfRetries" is null)
      and (age(now(), "lastRetry") >= make_interval(mins => cast(pow(coalesce("numberOfRetries", 0), 3) as int)) or "lastRetry" is null)
      LIMIT ${process.env.QUERY_TRIGGER_BATCH_SIZE}`;

  const ipfsFilesUrls = (await clients.db.rawSQL(query))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));

  return ipfsFilesUrls;
}

export const ipfsFileErrorRetry: Processor = {
  name: `ipfsFileErrorRetry`,
  trigger: ipfsFilesWithErrors,
  processorFunction: async (input: IPFSFile[], clients: Clients) => {
    const errorUpdates: IPFSFile[] = input.map((ipfsFile) => ({
      ...ipfsFile,
      error: undefined,
      numberOfRetries: (ipfsFile.numberOfRetries ?? 0) + 1,
      lastRetry: new Date()
    }));
    await clients.db.upsert(Table.ipfsFiles, errorUpdates, 'cid', undefined, true);
  },
  initialCursor: undefined
}

export const ipfsFileUrlErrorRetry: Processor = {
  name: `ipfsFileUrlErrorRetry`,
  trigger: ipfsFilesUrlsWithErrors,
  processorFunction: async (input: IPFSFileUrl[], clients: Clients) => {
    const errorUpdates: IPFSFileUrl[] = input.map((ipfsFileUrl) => ({
      ...ipfsFileUrl,
      error: undefined,
      numberOfRetries: (ipfsFileUrl.numberOfRetries ?? 0) + 1,
      lastRetry: new Date()
    }));
    await clients.db.upsert(Table.ipfsFilesUrls, errorUpdates, 'url', undefined, true);
  },
  initialCursor: undefined
}
