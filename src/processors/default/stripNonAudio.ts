import { nonAudioMetadata } from '../../triggers/nonAudio';
import { Metadata } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';

const name = 'stripNonAudio';

const processorFunction = async (metadatas: Metadata[], clients: Clients) => {
  console.log(`Processing updates for metadatas with types: ${metadatas.map(m => m.mimeType)}`);
  const metadataIdsForDelete = metadatas.map((m: Metadata) => m.id);
  await clients.db.delete('nfts', metadataIdsForDelete, 'metadataId');
  await clients.db.delete('metadatas', metadataIdsForDelete);
  console.log('Deleted');
};

export const stripNonAudio: Processor = {
  name,
  trigger: nonAudioMetadata,
  processorFunction,
  initialCursor: undefined
};
