import { missingMetadataIPFSHash } from '../../triggers/missing';
import { Metadata, getMetadataIPFSHash } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';

const name = 'addMetadataIPFSHash';

const processorFunction = async (metadatas: Metadata[], clients: Clients) => {
  console.log(`Processing updates from ${metadatas[0].nftId}`)
  const metadataUpdates = metadatas.map(m => ({
    nftId: m.nftId,
    metadataIPFSHash: getMetadataIPFSHash(m)
  }))
  const filteredMetadataUpdates = metadataUpdates.filter(m => (m.metadataIPFSHash !== undefined));
  await clients.db.update('metadatas', filteredMetadataUpdates);
};

export const addMetadataIPFSHashProcessor: Processor = {
  name,
  trigger: missingMetadataIPFSHash,
  processorFunction,
  initialCursor: undefined
};
