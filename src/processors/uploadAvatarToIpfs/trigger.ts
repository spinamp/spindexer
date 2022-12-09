import { extractHashFromURL } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { missingMetadataIPFSHash } from '../../triggers/missing';
import { getMetadataURL } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';
import { Trigger } from '../../types/trigger';

export const avatarsNotOnIpfs: Trigger<undefined> = async (clients: Clients) => {
  const query = `select * from "${Table.artistProfiles}" as t
      left outer join "${Table.ipfsFiles}" i
      on t."avatarUrl" = i.url
      where "avatarIPFSHash" is null
      and "avatarUrl" is not null
      and i.error is null
      LIMIT ${process.env.IPFS_UPLOAD_BATCH_SIZE || process.env.QUERY_TRIGGER_BATCH_SIZE!}`

  const artistProfilesWithFiles = (await clients.db.rawSQL(
    query
  )).rows

  return artistProfilesWithFiles
};
